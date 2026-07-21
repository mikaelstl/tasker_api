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
  changes?: AuditLogChanges;
};

export type AuditLogChanges = Record<
  string,
  {
    oldValue: AuditLogChangeValue;
    newValue: AuditLogChangeValue;
  }
>;

type AuditLogChangeValue =
  | string
  | number
  | boolean
  | null
  | AuditLogChangeValue[]
  | { [key: string]: AuditLogChangeValue };
