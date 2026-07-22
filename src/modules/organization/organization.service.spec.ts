import { OrganizationNotFoundException } from 'src/common/errors/resource-not-found.exceptions';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  const createService = (repository: any) => new OrganizationService(
    repository,
    {} as any,
    {} as any,
    {} as any,
  );

  it('retorna o sumário encontrado', async () => {
    const summary = { name: 'Acme', projects: 3, members: 5 };
    const repository = {
      findSummary: jest.fn().mockResolvedValue(summary),
    };
    const service = createService(repository);

    await expect(service.getSummary('org-1')).resolves.toEqual(summary);
    expect(repository.findSummary).toHaveBeenCalledWith('org-1');
  });

  it('informa quando a organização não existe', async () => {
    const repository = {
      findSummary: jest.fn().mockResolvedValue(null),
    };
    const service = createService(repository);

    await expect(service.getSummary('org-1'))
      .rejects.toBeInstanceOf(OrganizationNotFoundException);
  });
});
