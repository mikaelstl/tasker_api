import {
  AuditAction,
  AuditActorType,
  AuditResource,
} from 'generated/prisma';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const create = jest.fn();
  const service = new AuditLogService({
    auditLog: { create },
  } as any);

  beforeEach(() => {
    create.mockReset();
  });

  it('creates a user audit log', async () => {
    create.mockResolvedValue({ id: 'audit-log-id' });

    await expect(
      service.log({
        orgkey: 'org-id',
        actorkey: 'username',
        actorType: AuditActorType.USER,
        action: AuditAction.CREATE,
        resource: AuditResource.PROJECTS,
        resourcekey: 'project-id',
        changes: {
          title: { oldValue: null, newValue: 'Novo projeto' },
        },
      }),
    ).resolves.toEqual({ id: 'audit-log-id' });

    expect(create).toHaveBeenCalledWith({
      data: {
        orgkey: 'org-id',
        actorkey: 'username',
        actorType: AuditActorType.USER,
        action: AuditAction.CREATE,
        resource: AuditResource.PROJECTS,
        resourcekey: 'project-id',
        changes: {
          title: { oldValue: null, newValue: 'Novo projeto' },
        },
      },
    });
  });

  it('normalizes optional keys for a system audit log', async () => {
    create.mockResolvedValue({ id: 'audit-log-id' });

    await service.log({
      orgkey: 'org-id',
      actorType: AuditActorType.SYSTEM,
      action: AuditAction.SYSTEM_UPDATE,
      resource: AuditResource.TASKS,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        orgkey: 'org-id',
        actorkey: null,
        actorType: AuditActorType.SYSTEM,
        action: AuditAction.SYSTEM_UPDATE,
        resource: AuditResource.TASKS,
        resourcekey: null,
        changes: {},
      },
    });
  });

  it('rejects a user audit log without an actor', async () => {
    await expect(
      service.log({
        orgkey: 'org-id',
        actorType: AuditActorType.USER,
        action: AuditAction.UPDATE,
        resource: AuditResource.TASKS,
      }),
    ).rejects.toThrow('O ator deve ser informado');

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a system audit log with an actor', async () => {
    await expect(
      service.log({
        orgkey: 'org-id',
        actorkey: 'username',
        actorType: AuditActorType.SYSTEM,
        action: AuditAction.SYSTEM_UPDATE,
        resource: AuditResource.TASKS,
      }),
    ).rejects.toThrow('não devem possuir ator');

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects changes without oldValue and newValue', async () => {
    await expect(
      service.log({
        orgkey: 'org-id',
        actorkey: 'username',
        actorType: AuditActorType.USER,
        action: AuditAction.UPDATE,
        resource: AuditResource.TASKS,
        changes: {
          stage: { oldValue: 'PENDING' } as any,
        },
      }),
    ).rejects.toThrow('oldValue e newValue');

    expect(create).not.toHaveBeenCalled();
  });

  it('logs only changed fields and serializes dates', async () => {
    create.mockResolvedValue({ id: 'audit-log-id' });

    await service.logUserMutation({
      orgkey: 'org-id',
      actorkey: 'username',
      action: AuditAction.UPDATE,
      resource: AuditResource.PROJECTS,
      resourcekey: 'project-id',
      before: {
        title: 'Projeto',
        deadline: new Date('2026-07-22T10:00:00.000Z'),
      },
      after: {
        title: 'Projeto',
        deadline: new Date('2026-07-23T10:00:00.000Z'),
      },
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        changes: {
          deadline: {
            oldValue: '2026-07-22T10:00:00.000Z',
            newValue: '2026-07-23T10:00:00.000Z',
          },
        },
      }),
    });
  });

  it('does not include secrets in automatically detected changes', () => {
    expect(service.buildChanges(null, {
      name: 'Usuário',
      password: 'secret',
      token: 'secret-token',
    })).toEqual({
      name: { oldValue: null, newValue: 'Usuário' },
    });
  });
});
