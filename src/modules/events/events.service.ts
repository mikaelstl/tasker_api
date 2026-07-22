import { Injectable } from '@nestjs/common';
import { EventsRepository } from "./events.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';
import { AuditAction, AuditResource } from 'generated/prisma';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { EventCreateDTO } from './dto/event.create.dto';

@Injectable()
export class EventsService implements AccessValidator {
  constructor(
    private readonly repository: EventsRepository,
    private readonly audit: AuditLogService,
  ) { }

  async create(data: EventCreateDTO, context: AuditContext) {
    const event = await this.repository.create(data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.CREATE,
      resource: AuditResource.EVENTS,
      resourcekey: event.id,
      after: event as unknown as Record<string, unknown>,
      fields: ['title', 'date', 'projectkey', 'category'],
    });
    return event;
  }

  async edit(key: string, update: unknown, context: AuditContext) {
    const before = await this.repository.find(key);
    const event = await this.repository.edit(key, update);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.UPDATE,
      resource: AuditResource.EVENTS,
      resourcekey: event.id,
      before: before as unknown as Record<string, unknown>,
      after: event as unknown as Record<string, unknown>,
      fields: ['title', 'date', 'projectkey', 'category'],
    });
    return event;
  }

  async delete(key: string, context: AuditContext) {
    const event = await this.repository.delete(key);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.DELETE,
      resource: AuditResource.EVENTS,
      resourcekey: event.id,
      before: event as unknown as Record<string, unknown>,
      fields: ['title', 'date', 'projectkey', 'category'],
    });
    return event;
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          projectkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      throw new InternalException('Falha ao verificar o vínculo do evento.', err);
    }
  }
}
