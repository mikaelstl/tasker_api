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
        message: 'Criou um projeto',
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
        message: 'Criou um projeto',
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
      message: 'Sistema atualizou tarefas atrasadas',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        orgkey: 'org-id',
        actorkey: null,
        actorType: AuditActorType.SYSTEM,
        action: AuditAction.SYSTEM_UPDATE,
        resource: AuditResource.TASKS,
        resourcekey: null,
        message: 'Sistema atualizou tarefas atrasadas',
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
        message: 'Atualizou uma tarefa',
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
        message: 'Sistema atualizou uma tarefa',
      }),
    ).rejects.toThrow('não devem possuir ator');

    expect(create).not.toHaveBeenCalled();
  });
});
