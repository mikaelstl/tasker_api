import { Injectable } from '@nestjs/common';
import {
  AuditLogChangeValue,
  AuditLogChanges,
  CreateAuditLogInput,
} from './dto/create-audit-log.input';
import {
  AuditAction,
  AuditActorType,
  AuditResource,
} from 'generated/prisma';
import { PrismaService } from 'src/database/prisma.service';
import { ValidationException } from 'src/common/errors/validation.exception';
import { AuditContext } from 'src/common/interfaces/AuditContext';
import { FindAuditLogsQuery } from './dto/find-audit-logs.query';

type AuditedRecord = Record<string, unknown>;

export type UserMutationAuditInput = AuditContext & {
  action: AuditAction;
  resource: AuditResource;
  resourcekey: string;
  before?: AuditedRecord | null;
  after?: AuditedRecord | null;
  fields?: string[];
};

const INTERNAL_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'password',
  'token',
  'tokenHash',
]);

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgkey: string, query: FindAuditLogsQuery) {
    const {
      actorkey,
      action,
      resource,
      resourcekey,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;
    const where = {
      orgkey,
      actorkey,
      action,
      resource,
      resourcekey,
      created_at: startDate || endDate
        ? {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          }
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              username: true,
              name: true,
              photo: {
                select: { url: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

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

  async logUserMutation(data: UserMutationAuditInput) {
    return this.log({
      orgkey: data.orgkey,
      actorkey: data.actorkey,
      actorType: AuditActorType.USER,
      action: data.action,
      resource: data.resource,
      resourcekey: data.resourcekey,
      changes: this.buildChanges(data.before, data.after, data.fields),
    });
  }

  buildChanges(
    before: AuditedRecord | null = null,
    after: AuditedRecord | null = null,
    fields?: string[],
  ): AuditLogChanges {
    const selectedFields = (fields ?? Array.from(
      new Set([
        ...Object.keys(before ?? {}),
        ...Object.keys(after ?? {}),
      ]),
    )).filter((field) => !INTERNAL_FIELDS.has(field));

    return selectedFields.reduce<AuditLogChanges>((changes, field) => {
      const oldValue = this.toJsonValue(before?.[field]);
      const newValue = this.toJsonValue(after?.[field]);

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = { oldValue, newValue };
      }

      return changes;
    }, {});
  }

  private validateActor(data: CreateAuditLogInput): void {
    if (data.actorType === AuditActorType.USER && !data.actorkey) {
      throw new ValidationException(
        'O ator deve ser informado para logs gerados por usuário.',
      );
    }

    if (data.actorType === AuditActorType.SYSTEM && data.actorkey) {
      throw new ValidationException(
        'Logs gerados pelo sistema não devem possuir ator.',
      );
    }
  }

  private validateChanges(changes: CreateAuditLogInput['changes']): void {
    if (changes === undefined) return;

    if (!this.isPlainObject(changes)) {
      throw new ValidationException(
        'As alterações do audit log devem ser um objeto JSON.',
      );
    }

    for (const [field, change] of Object.entries(changes)) {
      if (!field || !this.isPlainObject(change)) {
        throw new ValidationException(
          'Cada campo alterado deve possuir oldValue e newValue.',
        );
      }

      const keys = Object.keys(change);
      if (
        !Object.prototype.hasOwnProperty.call(change, 'oldValue') ||
        !Object.prototype.hasOwnProperty.call(change, 'newValue') ||
        keys.some((key) => key !== 'oldValue' && key !== 'newValue')
      ) {
        throw new ValidationException(
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

  private toJsonValue(value: unknown): AuditLogChangeValue {
    if (value === undefined) return null;
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      return value as string | number | boolean | null;
    }
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.map((item) => this.toJsonValue(item));
    }
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([field]) => !INTERNAL_FIELDS.has(field))
          .map(([field, item]) => [field, this.toJsonValue(item)]),
      );
    }

    return String(value);
  }
}
