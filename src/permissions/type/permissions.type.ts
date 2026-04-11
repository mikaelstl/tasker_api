import { OrgRole } from "generated/prisma";
import { ActionType } from "@enums/Actions.enum"
import { Resources } from "@enums/Resources.enum"

type RoleResourceAccess = {
  resources: Resources[],
  actions: PermissionMap
}

type RolePermissions = {
  [K in OrgRole]: RoleResourceAccess
}

type BasePermission = `${Resources}.${ActionType}`;
type NestedPermission = `${Resources}.${Resources}.${ActionType}`;

type Permission = BasePermission | NestedPermission;

type PermissionMap = {
  [key: string]: Permission
}

export {
  RolePermissions,
  PermissionMap,
  Permission
}