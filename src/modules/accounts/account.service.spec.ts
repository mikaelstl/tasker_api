import { hash } from 'bcrypt';
import { AccountService } from './account.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('AccountService', () => {
  let repository: {
    editIdentity: jest.Mock;
    deleteIdentity: jest.Mock;
  };
  let service: AccountService;

  beforeEach(() => {
    repository = {
      editIdentity: jest.fn(),
      deleteIdentity: jest.fn(),
    };
    service = new AccountService(repository as any);
    jest.clearAllMocks();
  });

  it('edita usuário e conta no mesmo fluxo e cifra a nova senha', async () => {
    const result = {
      account: { id: 'account-1', email: 'novo@email.com' },
      user: { username: 'novo-usuario', name: 'Novo Nome' },
    };
    (hash as jest.Mock).mockResolvedValue('senha-cifrada');
    repository.editIdentity.mockResolvedValue(result);

    await expect(service.editIdentity('account-1', {
      name: 'Novo Nome',
      username: 'novo-usuario',
      email: 'novo@email.com',
      password: 'Senha@123',
    })).resolves.toEqual(result);

    expect(hash).toHaveBeenCalledWith('Senha@123', 8);
    expect(repository.editIdentity).toHaveBeenCalledWith(
      'account-1',
      {
        name: 'Novo Nome',
        username: 'novo-usuario',
        email: 'novo@email.com',
      },
      'senha-cifrada',
    );
  });

  it('não altera a senha quando ela não foi enviada', async () => {
    repository.editIdentity.mockResolvedValue({});

    await service.editIdentity('account-1', { name: 'Novo Nome' });

    expect(hash).not.toHaveBeenCalled();
    expect(repository.editIdentity).toHaveBeenCalledWith(
      'account-1',
      { name: 'Novo Nome' },
      undefined,
    );
  });

  it('remove usuário e conta no mesmo fluxo', async () => {
    repository.deleteIdentity.mockResolvedValue(undefined);

    await expect(service.deleteIdentity('account-1')).resolves.toBeUndefined();
    expect(repository.deleteIdentity).toHaveBeenCalledWith('account-1');
  });
});
