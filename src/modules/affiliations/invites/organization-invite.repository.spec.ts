import { OrgRole } from 'generated/prisma';
import { OrganizationInviteRepository } from './organization-invite.repository';

describe('OrganizationInviteRepository', () => {
  let prisma: any;
  let repository: OrganizationInviteRepository;

  beforeEach(() => {
    prisma = {
      organizationInvite: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      affiliation: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new OrganizationInviteRepository(prisma);
  });

  it('expõe um repository vinculado à conexão transacional', async () => {
    const transaction = {
      organizationInvite: prisma.organizationInvite,
      affiliation: prisma.affiliation,
    };
    prisma.$transaction.mockImplementation((callback) => callback(transaction));

    await repository.transaction((transactionRepository) =>
      transactionRepository.findByTokenHash('hash'),
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.organizationInvite.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash' },
      select: {
        id: true,
        orgkey: true,
        expiresAt: true,
        usedAt: true,
        rejectedAt: true,
        revokedAt: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });

  it('reivindica o convite somente se ele continuar disponível', async () => {
    const now = new Date('2026-07-26T12:00:00.000Z');

    await repository.claim('invite-1', now);

    expect(prisma.organizationInvite.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invite-1',
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
  });

  it('persiste a afiliação sempre com o papel MEMBER', async () => {
    await repository.createMemberAffiliation('guest', 'org-1');

    expect(prisma.affiliation.create).toHaveBeenCalledWith({
      data: {
        userkey: 'guest',
        orgkey: 'org-1',
        role: OrgRole.MEMBER,
      },
    });
  });

  it('registra a rejeição por atualização condicional', async () => {
    const now = new Date('2026-07-26T12:00:00.000Z');

    await repository.markRejected('invite-1', 'guest', now);

    expect(prisma.organizationInvite.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invite-1',
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        rejectedAt: now,
        rejectedBy: 'guest',
      },
    });
  });

  it('revoga somente pelo par inviteId e orgkey', async () => {
    const now = new Date('2026-07-26T12:00:00.000Z');

    await repository.revoke('invite-1', 'org-1', now);

    expect(prisma.organizationInvite.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invite-1',
        orgkey: 'org-1',
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });
  });
});
