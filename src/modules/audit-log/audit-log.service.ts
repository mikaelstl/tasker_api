import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuditLogInput } from './dto/create-audit-log.input';
import { AuditActorType } from 'generated/prisma';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogInput) {
    this.validateActor(data);

    return this.prisma.auditLog.create({
      data: {
        ...data,
        actorkey: data.actorkey ?? null,
        resourcekey: data.resourcekey ?? null,
      },
    });
  }

  private validateActor(data: CreateAuditLogInput): void {
    if (data.actorType === AuditActorType.USER && !data.actorkey) {
      throw new BadRequestException(
        'O ator deve ser informado para logs gerados por usuário.',
      );
    }

    if (data.actorType === AuditActorType.SYSTEM && data.actorkey) {
      throw new BadRequestException(
        'Logs gerados pelo sistema não devem possuir ator.',
      );
    }
  }
}
