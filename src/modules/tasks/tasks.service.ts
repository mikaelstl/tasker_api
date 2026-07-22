import { Injectable } from '@nestjs/common';
import { TasksRepository } from "./tasks.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';
import { AuditAction, AuditResource } from 'generated/prisma';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { TaskCreateDTO } from './dto/task.create.dto';

@Injectable()
export class TasksService implements AccessValidator {
  constructor (
    private readonly repository: TasksRepository,
    private readonly audit: AuditLogService,
  ) {}

  async create(data: TaskCreateDTO, context: AuditContext) {
    const task = await this.repository.create(data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.CREATE,
      resource: AuditResource.TASKS,
      resourcekey: task.id,
      after: task as unknown as Record<string, unknown>,
      fields: ['code', 'name', 'description', 'projectkey', 'ownerkey', 'priority', 'deadline', 'stage'],
    });
    return task;
  }

  async edit(projectkey: string, code: string, update: unknown, context: AuditContext) {
    const before = await this.repository.find(projectkey, code);
    const task = await this.repository.edit(projectkey, code, update);
    await this.audit.logUserMutation({
      ...context,
      action: before.stage !== task.stage
        ? AuditAction.STATUS_CHANGE
        : AuditAction.UPDATE,
      resource: AuditResource.TASKS,
      resourcekey: task.id,
      before: before as unknown as Record<string, unknown>,
      after: task as unknown as Record<string, unknown>,
      fields: ['name', 'description', 'ownerkey', 'priority', 'deadline', 'stage', 'delayed'],
    });
    return task;
  }

  async delete(key: string, context: AuditContext) {
    const task = await this.repository.delete(key);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.DELETE,
      resource: AuditResource.TASKS,
      resourcekey: task.id,
      before: task as unknown as Record<string, unknown>,
      fields: ['code', 'name', 'description', 'projectkey', 'ownerkey', 'priority', 'deadline', 'stage'],
    });
    return task;
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          ownerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade da tarefa.', err);
    }
  }
}
