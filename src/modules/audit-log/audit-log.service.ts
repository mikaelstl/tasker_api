import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuditLogInput } from './dto/create-audit-log.input';
import { AuditActorType } from 'generated/prisma';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogInput) {
    this.validateActor(data);
    this.validateChanges(data.changes);

    return this.prisma.auditLog.create({
      data: {
        ...data,
        actorkey: data.actorkey ?? null,
        resourcekey: data.resourcekey ?? null,
        changes: data.changes ?? {},
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

  private validateChanges(changes: CreateAuditLogInput['changes']): void {
    if (changes === undefined) return;

    if (!this.isPlainObject(changes)) {
      throw new BadRequestException(
        'As alterações do audit log devem ser um objeto JSON.',
      );
    }

    for (const [field, change] of Object.entries(changes)) {
      if (!field || !this.isPlainObject(change)) {
        throw new BadRequestException(
          'Cada campo alterado deve possuir oldValue e newValue.',
        );
      }

      const keys = Object.keys(change);
      if (
        !Object.prototype.hasOwnProperty.call(change, 'oldValue') ||
        !Object.prototype.hasOwnProperty.call(change, 'newValue') ||
        keys.some((key) => key !== 'oldValue' && key !== 'newValue')
      ) {
        throw new BadRequestException(
          'Cada campo alterado deve possuir somente oldValue e newValue.',
        );
      }
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  }
}
