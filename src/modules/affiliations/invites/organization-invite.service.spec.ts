import { createHash } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

jest.mock('src/config/env.config', () => ({
  ORGANIZATION_INVITE_SECRET: 'organization-invite-test-secret',
}));

import { InviteUnavailableException } from 'src/common/errors/invite-unavailable.exception';
import { ConflictException } from 'src/common/errors/conflict.exception';
import { InternalException } from 'src/common/errors/internal.exception';
import { OrganizationInviteService } from './organization-invite.service';
import { describe } from 'node:test';

const SECRET = 'organization-invite-test-secret';

function signedToken(
  orgkey = 'org-1',
  exp = Math.floor(Date.now() / 1000) + 3600,
) {
  return jwt.sign({ orgkey, exp }, SECRET, {
    algorithm: 'HS256',
    noTimestamp: true,
  });
}

describe('OrganizationInviteService', () => {
  let repository: any;
  let service: OrganizationInviteService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      findAffiliation: jest.fn(),
      claim: jest.fn(),
      createMemberAffiliation: jest.fn(),
      markRejected: jest.fn(),
      revoke: jest.fn(),
    };
    repository.transaction = jest.fn((callback) => callback(repository));
    service = new OrganizationInviteService(repository);
  });

  it('emite somente orgkey e exp e persiste apenas o hash do token', async () => {
    repository.create.mockImplementation((_orgkey, _tokenHash, expiresAt) => ({
      id: 'invite-1',
      expiresAt,
    }));

    const result = await service.create('org-1', 'owner');
    const payload = jwt.verify(result.token, SECRET);

    expect(payload).toEqual({
      orgkey: 'org-1',
      exp: expect.any(Number),
    });
    expect(repository.create).toHaveBeenCalledWith(
      'org-1',
      createHash('sha256').update(result.token).digest('hex'),
      result.expiresAt,
    );
    expect(repository.create.mock.calls[0][1]).not.toBe(result.token);
    expect(result).not.toHaveProperty('url');

    const expiresInSeconds =
      (result.expiresAt.getTime() - Date.now()) / 1000;
    expect(expiresInSeconds).toBeGreaterThanOrEqual(24 * 60 * 60 - 1);
    expect(expiresInSeconds).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it('gera tokens distintos para convites criados no mesmo segundo', async () => {
    repository.create
      .mockImplementationOnce((_orgkey, _tokenHash, expiresAt) => ({
        id: 'invite-1',
        expiresAt,
      }))
      .mockImplementationOnce((_orgkey, _tokenHash, expiresAt) => ({
        id: 'invite-2',
        expiresAt,
      }));

    const first = await service.create('org-1', 'owner');
    const second = await service.create('org-1', 'owner');

    expect(first.token).not.toBe(second.token);
  });

  it('retorna preview uniforme sem consultar o banco para token adulterado', async () => {
    await expect(service.preview(`${signedToken()}alterado`)).resolves.toEqual({
      valid: false,
      expiresAt: null,
      organization: null,
    });
    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('retorna somente dados públicos para um convite disponível', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signedToken('org-1', exp);
    repository.findByTokenHash.mockResolvedValue({
      id: 'invite-1',
      orgkey: 'org-1',
      expiresAt: new Date(exp * 1000),
      usedAt: null,
      rejectedAt: null,
      revokedAt: null,
      org: {
        id: 'org-1',
        name: 'Organização',
      },
    });

    await expect(service.preview(token)).resolves.toEqual({
      valid: true,
      expiresAt: new Date(exp * 1000),
      organization: {
        id: 'org-1',
        name: 'Organização',
      },
    });
  });

  it('não aceita token com assinatura inválida', async () => {
    await expect(
      service.accept(`${signedToken()}alterado`, 'guest'),
    ).rejects.toBeInstanceOf(InviteUnavailableException);
    expect(repository.transaction).not.toHaveBeenCalled();
  });

  it('usa o username autenticado e o orgkey assinado no aceite', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signedToken('org-1', exp);
    repository.findByTokenHash.mockResolvedValue({
      id: 'invite-1',
      orgkey: 'org-1',
      expiresAt: new Date(exp * 1000),
      usedAt: null,
      rejectedAt: null,
      revokedAt: null,
      org: {
        id: 'org-1',
        name: 'Organização',
      },
    });
    repository.findAffiliation.mockResolvedValue(null);
    repository.claim.mockResolvedValue({ count: 1 });
    repository.createMemberAffiliation.mockResolvedValue({
      id: 'affiliation-1',
      orgkey: 'org-1',
      userkey: 'guest',
      role: 'MEMBER',
    });

    await service.accept(token, 'guest');

    expect(repository.findByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(repository.findAffiliation).toHaveBeenCalledWith('guest', 'org-1');
    expect(repository.claim).toHaveBeenCalledWith('invite-1', expect.any(Date));
    expect(repository.createMemberAffiliation).toHaveBeenCalledWith(
      'guest',
      'org-1',
    );
  });

  it('não consome o convite quando o usuário já é afiliado', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signedToken('org-1', exp);
    repository.findByTokenHash.mockResolvedValue({
      id: 'invite-1',
      orgkey: 'org-1',
      expiresAt: new Date(exp * 1000),
      usedAt: null,
      rejectedAt: null,
      revokedAt: null,
    });
    repository.findAffiliation.mockResolvedValue({
      id: 'existing-affiliation',
    });

    await expect(service.accept(token, 'guest')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.claim).not.toHaveBeenCalled();
  });

  it('falha uniformemente quando outra requisição reivindica o convite', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signedToken('org-1', exp);
    repository.findByTokenHash.mockResolvedValue({
      id: 'invite-1',
      orgkey: 'org-1',
      expiresAt: new Date(exp * 1000),
      usedAt: null,
      rejectedAt: null,
      revokedAt: null,
    });
    repository.findAffiliation.mockResolvedValue(null);
    repository.claim.mockResolvedValue({ count: 0 });

    await expect(service.accept(token, 'guest')).rejects.toBeInstanceOf(
      InviteUnavailableException,
    );
    expect(repository.createMemberAffiliation).not.toHaveBeenCalled();
  });

  it('rejeita condicionalmente e registra o usuário autenticado', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = signedToken('org-1', exp);
    repository.findByTokenHash.mockResolvedValue({
      id: 'invite-1',
      orgkey: 'org-1',
      expiresAt: new Date(exp * 1000),
      usedAt: null,
      rejectedAt: null,
      revokedAt: null,
    });
    repository.markRejected.mockResolvedValue({ count: 1 });

    const result = await service.reject(token, 'guest');

    expect(repository.markRejected).toHaveBeenCalledWith(
      'invite-1',
      'guest',
      expect.any(Date),
    );
    expect(result.rejectedAt).toBeInstanceOf(Date);
  });

  it('converte falha técnica do banco em InternalException com a causa', async () => {
    const databaseError = new Error('connection refused');
    repository.create.mockRejectedValue(databaseError);

    await expect(service.create('org-1', 'owner')).rejects.toMatchObject({
      name: InternalException.name,
      cause: databaseError,
    });
  });
});
