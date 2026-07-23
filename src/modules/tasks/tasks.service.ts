import { Injectable } from '@nestjs/common';
import { TasksRepository } from "./tasks.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';
import { AuditAction, AuditResource } from 'generated/prisma';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { TaskCreateDTO } from './dto/task.create.dto';
import { EditTaskDTO } from './dto/edit.dto';
import { AccessDeniedException } from 'src/common/errors/access-denied.exception';
import { MemberNotFoundException } from 'src/common/errors/resource-not-found.exceptions';
import { ProjectNotFoundException } from 'src/common/errors/project-not-found.exception';

@Injectable()
export class TasksService implements AccessValidator {
  constructor (
    private readonly repository: TasksRepository,
    private readonly audit: AuditLogService,
  ) {}

  async create(data: TaskCreateDTO, context: AuditContext) {
    if (!await this.repository.projectBelongsToOrganization(
      data.project,
      context.orgkey,
    )) {
      throw new ProjectNotFoundException();
    }

    if (!await this.repository.memberBelongsToProject(
      data.owner,
      data.project,
    )) {
      throw new MemberNotFoundException();
    }

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

  async edit(
    projectkey: string,
    code: string,
    update: EditTaskDTO,
    context: AuditContext,
  ) {
    const editContext = await this.repository.findEditContext(
      projectkey,
      code,
      context.orgkey,
    );
    const canManage = editContext.project.org.ownerkey === context.actorkey
      || editContext.project.manager?.userkey === context.actorkey;
    const ownsTask = editContext.owner?.user.userkey === context.actorkey;

    if (!canManage && !ownsTask) {
      throw new AccessDeniedException();
    }

    if (update.ownerkey !== undefined) {
      if (!canManage) {
        throw new AccessDeniedException(
          'Somente o proprietário da organização ou o gestor do projeto pode reatribuir a tarefa.',
        );
      }

      if (update.ownerkey !== null) {
        const ownerBelongsToProject = await this.repository.memberBelongsToProject(
          update.ownerkey,
          projectkey,
        );

        if (!ownerBelongsToProject) {
          throw new MemberNotFoundException();
        }
      }
    }

    const before = editContext;
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
      return await this.repository.isOwnedByUser(targetkey, subjectkey);
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade da tarefa.', err);
    }
  }

  public async ownsTask(
    username: string,
    projectkey: string,
    code: string,
  ): Promise<boolean> {
    try {
      return await this.repository.isOwnedByUserAndCode(
        projectkey,
        code,
        username,
      );
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade da tarefa.', err);
    }
  }
}
