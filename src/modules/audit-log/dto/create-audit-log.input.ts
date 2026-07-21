import {
  AuditAction,
  AuditActorType,
  AuditResource,
} from 'generated/prisma';

export type CreateAuditLogInput = {
  orgkey: string;
  actorkey?: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resource: AuditResource;
  resourcekey?: string | null;
  message: string;
};
