import { ConflictException } from 'src/common/errors/conflict.exception';
import { AccountRepository } from './account.repository';

describe('AccountRepository', () => {
  it('bloqueia a exclusão quando o usuário possui organizações', async () => {
    const transaction = {
      account: {
        findUnique: jest.fn().mockResolvedValue({
          user: {
            username: 'owner',
            _count: { organizations: 1 },
          },
        }),
        delete: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new AccountRepository(prisma as any);

    await expect(repository.deleteIdentity('account-1'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(transaction.account.delete).not.toHaveBeenCalled();
  });

  it('exclui a conta quando o usuário não possui organizações', async () => {
    const transaction = {
      account: {
        findUnique: jest.fn().mockResolvedValue({
          user: {
            username: 'member',
            _count: { organizations: 0 },
          },
        }),
        delete: jest.fn().mockResolvedValue({ id: 'account-1' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new AccountRepository(prisma as any);

    await expect(repository.deleteIdentity('account-1')).resolves.toBeUndefined();
    expect(transaction.account.delete).toHaveBeenCalledWith({
      where: { id: 'account-1' },
    });
  });
});
