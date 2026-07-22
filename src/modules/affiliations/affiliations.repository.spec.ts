import { AffiliationRepository } from './affiliations.repository';

describe('AffiliationRepository', () => {
  it('lista as afiliações da organização com os dados dos usuários', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new AffiliationRepository({
      affiliation: { findMany },
    } as any);

    await repository.findByOrganization('org-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        orgkey: 'org-1',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  });
});
