import { OrganizationRepository } from './organization.repository';

describe('OrganizationRepository', () => {
  it('retorna nome e totais da organização', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      name: 'Acme',
      _count: {
        projects: 3,
        members: 5,
      },
    });
    const repository = new OrganizationRepository({
      organization: { findUnique },
    } as any);

    await expect(repository.findSummary('org-1')).resolves.toEqual({
      name: 'Acme',
      projects: 3,
      members: 5,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        id: 'org-1',
      },
      select: {
        name: true,
        _count: {
          select: {
            projects: true,
            members: true,
          },
        },
      },
    });
  });
});
