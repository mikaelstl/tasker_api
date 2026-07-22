import { ProjectRepository } from "./projects.repository";

describe('ProjectRepository visibility scopes', () => {
  let findMany: jest.Mock;
  let repository: ProjectRepository;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    repository = new ProjectRepository({
      project: { findMany },
    } as any);
  });

  it('lista todos os projetos da organização para OWNER', async () => {
    await repository.listByOrganizer('org-1', { title: 'Projeto' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        title: 'Projeto',
        orgkey: 'org-1',
      },
    });
  });

  it('lista projetos gerenciados ou participados para MANAGER', async () => {
    await repository.listByManager('affiliation-1', 'org-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        orgkey: 'org-1',
        OR: [
          { managerkey: 'affiliation-1' },
          {
            members: {
              some: { userkey: 'affiliation-1' },
            },
          },
        ],
      },
    });
  });

  it('lista somente projetos participados para MEMBER', async () => {
    await repository.listByMember('affiliation-1', 'org-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        orgkey: 'org-1',
        members: {
          some: { userkey: 'affiliation-1' },
        },
      },
    });
  });

  it('não permite que a query substitua a organização ativa', async () => {
    await repository.listByOrganizer('org-1', { orgkey: 'org-2' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        orgkey: 'org-1',
      },
    });
  });
});
