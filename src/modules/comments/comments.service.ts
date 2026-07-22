import { Injectable } from '@nestjs/common';
import { CommentsRepository } from "./comments.repository";
import { InternalException } from 'src/common/errors/internal.exception';
import { AuditAction, AuditResource } from 'generated/prisma';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { CreateCommentDTO } from './dto/comment.create.dto';

@Injectable()
export class CommentsService {
  constructor (
    private readonly repository: CommentsRepository,
    private readonly audit: AuditLogService,
  ) {}

  async create(data: CreateCommentDTO, context: AuditContext) {
    const comment = await this.repository.create(data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.COMMENT,
      resource: AuditResource.COMMENTS,
      resourcekey: comment.id,
      after: comment as unknown as Record<string, unknown>,
      fields: ['content', 'projectkey'],
    });
    return comment;
  }

  async delete(key: string, context: AuditContext) {
    const comment = await this.repository.delete(key);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.DELETE,
      resource: AuditResource.COMMENTS,
      resourcekey: comment.id,
      before: comment as unknown as Record<string, unknown>,
      fields: ['content', 'projectkey'],
    });
    return comment;
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          ownerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade do comentário.', err);
    }
  }
}
