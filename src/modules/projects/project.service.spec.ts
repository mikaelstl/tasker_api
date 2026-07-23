import { OrgRole } from "generated/prisma";
import { AccessDeniedException } from "src/common/errors/access-denied.exception";
import { ProjectService } from "./project.service";

describe('ProjectService', () => {
  const account = {
    id: 'account-1',
    username: 'user-1',
    email: 'user@example.com',
  };
  const orgkey = 'org-1';

  let repository: any;
  let affiliations: any;
  let service: ProjectService;

  beforeEach(() => {
    repository = {
      listByOrganizer: jest.fn(),
      listByManager: jest.fn(),
      listByMember: jest.fn(),
      find: jest.fn(),
      edit: jest.fn(),
    };
    affiliations = {
      findByUserAndOrgkey: jest.fn(),
    };
    service = new ProjectService(repository, affiliations);
  });

  it('aceita como gestor apenas MANAGER da mesma organização', async () => {
    const project = {
      id: 'project-1',
      orgkey,
      managerkey: null,
      stage: 'STARTED',
    };
    repository.find.mockResolvedValue(project);
    repository.edit.mockResolvedValue({
      ...project,
      managerkey: 'manager-affiliation',
    });
    affiliations.findByIdAndOrganization = jest.fn().mockResolvedValue({
      id: 'manager-affiliation',
      orgkey,
      role: OrgRole.MANAGER,
    });

    await expect(service.edit(
      'project-1',
      { managerkey: 'manager-affiliation' },
      { orgkey, actorkey: 'owner' },
    )).resolves.toMatchObject({ managerkey: 'manager-affiliation' });
    expect(repository.edit).toHaveBeenCalledWith(
      'project-1',
      orgkey,
      { managerkey: 'manager-affiliation' },
    );
  });

  it.each([
    [OrgRole.OWNER, 'listByOrganizer', [orgkey, { stage: 'STARTED' }]],
    [OrgRole.MANAGER, 'listByManager', ['affiliation-1', orgkey, { stage: 'STARTED' }]],
    [OrgRole.MEMBER, 'listByMember', ['affiliation-1', orgkey, { stage: 'STARTED' }]],
  ])(
    'aplica o escopo de listagem para %s',
    async (role, method, expectedArguments) => {
      affiliations.findByUserAndOrgkey.mockResolvedValue({
        id: 'affiliation-1',
        role,
      });
      repository[method].mockResolvedValue([{ id: 'project-1' }]);

      const result = await service.list(
        account,
        orgkey,
        { stage: 'STARTED' as any },
      );

      expect(repository[method]).toHaveBeenCalledWith(...expectedArguments);
      expect(result).toEqual([{ id: 'project-1' }]);
    },
  );

  it.each([
    [OrgRole.OWNER, null, []],
    [OrgRole.MANAGER, 'affiliation-1', []],
    [OrgRole.MANAGER, null, [{ userkey: 'affiliation-1' }]],
    [OrgRole.MEMBER, null, [{ userkey: 'affiliation-1' }]],
  ])(
    'permite find para %s quando a relação exigida existe',
    async (role, managerkey, members) => {
      affiliations.findByUserAndOrgkey.mockResolvedValue({
        id: 'affiliation-1',
        role,
      });
      repository.find.mockResolvedValue({
        id: 'project-1',
        managerkey,
        members,
      });

      await expect(service.find('project-1', account, orgkey))
        .resolves.toMatchObject({ id: 'project-1' });
      expect(repository.find).toHaveBeenCalledWith('project-1', { orgkey });
    },
  );

  it.each([OrgRole.MANAGER, OrgRole.MEMBER])(
    'bloqueia find para %s sem vínculo com o projeto',
    async (role) => {
      affiliations.findByUserAndOrgkey.mockResolvedValue({
        id: 'affiliation-1',
        role,
      });
      repository.find.mockResolvedValue({
        id: 'project-1',
        managerkey: 'another-affiliation',
        members: [],
      });

      await expect(service.find('project-1', account, orgkey))
        .rejects.toBeInstanceOf(AccessDeniedException);
    },
  );
});
