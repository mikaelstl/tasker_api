import { OrgRole } from 'generated/prisma';
import { BusinessRuleException } from 'src/common/errors/business-rule.exception';
import { AffiliationService } from './affiliations.service';

describe('AffiliationService', () => {
  let repository: any;
  let audit: any;
  let service: AffiliationService;

  beforeEach(() => {
    repository = {
      findByUserAndOrgkey: jest.fn(),
      findByOrganization: jest.fn(),
      findByIdAndOrganization: jest.fn(),
      transferOwnership: jest.fn(),
      update: jest.fn(),
    };
    audit = {
      logUserMutation: jest.fn(),
    };
    service = new AffiliationService(repository, audit);
  });

  it('promove somente MEMBER para MANAGER', async () => {
    repository.findByIdAndOrganization.mockResolvedValue({
      id: 'affiliation-1',
      orgkey: 'org-1',
      userkey: 'user-1',
      role: OrgRole.MEMBER,
    });
    repository.update.mockImplementation((id, orgkey, data) => ({
      ...data,
      id,
      orgkey,
    }));

    await expect(service.promote('affiliation-1', {
      orgkey: 'org-1',
      actorkey: 'owner',
    })).resolves.toMatchObject({ role: OrgRole.MANAGER });
    expect(repository.update).toHaveBeenCalledWith(
      'affiliation-1',
      'org-1',
      expect.objectContaining({ role: OrgRole.MANAGER }),
    );
  });

  it('não promove MANAGER para OWNER pelo fluxo comum', async () => {
    repository.findByIdAndOrganization.mockResolvedValue({
      id: 'affiliation-1',
      orgkey: 'org-1',
      userkey: 'user-1',
      role: OrgRole.MANAGER,
    });

    await expect(service.promote('affiliation-1', {
      orgkey: 'org-1',
      actorkey: 'owner',
    })).rejects.toBeInstanceOf(BusinessRuleException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('transfere a propriedade apenas quando o solicitante é OWNER', async () => {
    repository.findByUserAndOrgkey.mockResolvedValue({
      id: 'owner-affiliation',
      orgkey: 'org-1',
      userkey: 'old-owner',
      role: OrgRole.OWNER,
    });
    repository.transferOwnership.mockResolvedValue({
      id: 'target-affiliation',
      orgkey: 'org-1',
      userkey: 'new-owner',
      role: OrgRole.OWNER,
    });

    await expect(service.transferOwnership('target-affiliation', {
      orgkey: 'org-1',
      actorkey: 'old-owner',
    })).resolves.toMatchObject({
      userkey: 'new-owner',
      role: OrgRole.OWNER,
    });
    expect(repository.transferOwnership)
      .toHaveBeenCalledWith('org-1', 'target-affiliation', 'old-owner');
  });

  it('lista as afiliações quando o usuário pertence à organização', async () => {
    const affiliations = [{ id: 'affiliation-1', orgkey: 'org-1' }];
    repository.findByUserAndOrgkey.mockResolvedValue({
      id: 'requester-affiliation',
    });
    repository.findByOrganization.mockResolvedValue(affiliations);

    await expect(
      service.getOrganizationAffiliations('org-1', 'user-1'),
    ).resolves.toEqual(affiliations);

    expect(repository.findByUserAndOrgkey)
      .toHaveBeenCalledWith('user-1', 'org-1');
    expect(repository.findByOrganization).toHaveBeenCalledWith('org-1');
  });

  it('não consulta as afiliações quando o usuário não pertence à organização', async () => {
    repository.findByUserAndOrgkey.mockResolvedValue(null);

    await expect(
      service.getOrganizationAffiliations('org-1', 'user-1'),
    ).rejects.toThrow();

    expect(repository.findByOrganization).not.toHaveBeenCalled();
  });
});
