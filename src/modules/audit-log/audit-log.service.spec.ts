import {
  AuditAction,
  AuditActorType,
  AuditResource,
} from 'generated/prisma';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const create = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();
  const service = new AuditLogService({
    auditLog: { create, findMany, count },
  } as any);

  beforeEach(() => {
    create.mockReset();
    findMany.mockReset();
    count.mockReset();
  });

  it('lists organization audit logs with filters and pagination', async () => {
    const items = [{ id: 'audit-log-id' }];
    findMany.mockResolvedValue(items);
    count.mockResolvedValue(21);

    await expect(service.list('org-id', {
      actorkey: 'username',
      action: AuditAction.UPDATE,
      resource: AuditResource.TASKS,
      resourcekey: 'task-id',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.999Z',
      page: 2,
      limit: 10,
    })).resolves.toEqual({
      items,
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });

    const where = {
      orgkey: 'org-id',
      actorkey: 'username',
      action: AuditAction.UPDATE,
      resource: AuditResource.TASKS,
      resourcekey: 'task-id',
      created_at: {
        gte: new Date('2026-07-01T00:00:00.000Z'),
        lte: new Date('2026-07-31T23:59:59.999Z'),
      },
    };
    expect(findMany).toHaveBeenCalledWith({
      where,
      include: {
        actor: {
          select: {
            username: true,
            name: true,
            photo: { select: { url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(count).toHaveBeenCalledWith({ where });
  });

  it('uses the default page and limit when listing audit logs', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    await expect(service.list('org-id', {} as any)).resolves.toEqual({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 20,
      orderBy: { created_at: 'desc' },
    }));
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
