import { Injectable } from '@nestjs/common';
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { MembersRepository } from "./member.repository";
import { AuditAction, AuditResource } from 'generated/prisma';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { DefineMemberDTO } from './dto/member.create.dto';

@Injectable()
export class MembersService implements AccessValidator {
  constructor(
    private readonly repository: MembersRepository,
    private readonly audit: AuditLogService,
  ) { }

  async create(data: DefineMemberDTO, context: AuditContext) {
    const member = await this.repository.create(data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.ADD,
      resource: AuditResource.MEMBERS,
      resourcekey: member.id,
      after: member as unknown as Record<string, unknown>,
      fields: ['userkey', 'projectkey'],
    });
    return member;
  }

  async delete(key: string, context: AuditContext) {
    const member = await this.repository.delete(key);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.REMOVE,
      resource: AuditResource.MEMBERS,
      resourcekey: member.id,
      before: member as unknown as Record<string, unknown>,
      fields: ['userkey', 'projectkey'],
    });
    return member;
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    return false;
  }

  async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    return this.repository.participates(targetkey, subjectkey);
  }
}
