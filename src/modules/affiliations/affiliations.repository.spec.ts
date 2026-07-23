import { AffiliationRepository } from './affiliations.repository';
import { OrgRole, Prisma } from 'generated/prisma';

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

  it('transfere a propriedade com os três updates na mesma transação', async () => {
    const transaction = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org-1',
          ownerkey: 'old-owner',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      affiliation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'target-affiliation',
          orgkey: 'org-1',
          userkey: 'new-owner',
          role: OrgRole.MANAGER,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-owner-affiliation',
          orgkey: 'org-1',
          userkey: 'old-owner',
          role: OrgRole.OWNER,
        }),
        update: jest.fn()
          .mockResolvedValueOnce({ role: OrgRole.MEMBER })
          .mockResolvedValueOnce({
            id: 'target-affiliation',
            orgkey: 'org-1',
            userkey: 'new-owner',
            role: OrgRole.OWNER,
          }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new AffiliationRepository(prisma as any);

    await expect(repository.transferOwnership(
      'org-1',
      'target-affiliation',
      'old-owner',
    )).resolves.toMatchObject({
      userkey: 'new-owner',
      role: OrgRole.OWNER,
    });
    expect(transaction.affiliation.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'old-owner-affiliation' },
      data: { role: OrgRole.MEMBER },
    });
    expect(transaction.affiliation.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'target-affiliation' },
      data: { role: OrgRole.OWNER },
    });
    expect(transaction.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { ownerkey: 'new-owner' },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  });
});
