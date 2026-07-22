import { AffiliationService } from './affiliations.service';

describe('AffiliationService', () => {
  let repository: any;
  let service: AffiliationService;

  beforeEach(() => {
    repository = {
      findByUserAndOrgkey: jest.fn(),
      findByOrganization: jest.fn(),
    };
    service = new AffiliationService(repository, {} as any);
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
