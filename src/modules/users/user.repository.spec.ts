import { UserNotFoundException } from 'src/common/errors/user-not-found.exception';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  describe('findProfileByAccountId', () => {
    it('retorna nome, username e email do usuário autenticado', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        name: 'Maria Silva',
        username: 'maria',
        account: {
          email: 'maria@email.com',
        },
      });
      const repository = new UserRepository({
        user: { findUnique },
      } as any);

      await expect(
        repository.findProfileByAccountId('account-1'),
      ).resolves.toEqual({
        name: 'Maria Silva',
        username: 'maria',
        email: 'maria@email.com',
      });

      expect(findUnique).toHaveBeenCalledWith({
        where: {
          accountkey: 'account-1',
        },
        select: {
          name: true,
          username: true,
          account: {
            select: {
              email: true,
            },
          },
        },
      });
    });

    it('informa quando não existe usuário para a conta autenticada', async () => {
      const repository = new UserRepository({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      } as any);

      await expect(
        repository.findProfileByAccountId('account-1'),
      ).rejects.toBeInstanceOf(UserNotFoundException);
    });
  });
});
