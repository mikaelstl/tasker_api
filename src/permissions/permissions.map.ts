import { OrgRole } from "generated/prisma"
import { ActionType, BaseActions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";
import { RolePermissions, PermissionMap, Permission } from "@permissions/type/permissions.type";

const except = (map: Map<ActionType, Permission>, ...values: ActionType[]) => {
  const newMap = map;

  values.map(
    (action) => newMap.delete(action)
  );

  return newMap;
}

const PROJECT_ACTIONS = new Map<ActionType, Permission>();

const ROLE_PERMISSIONS: RolePermissions = {
  OWNER: {
    resources: [ Resources.ALL ],
    actions: {}
  },
  MANAGER: {
    resources: [
      Resources.PROJECTS,
      Resources.TASKS,
      Resources.COMMENTS,
      Resources.MEMBERS,
      Resources.EVENTS
    ],
    actions: {}
  },
  MEMBER: {
    resources: [
      Resources.PROJECTS,
      Resources.TASKS,
      Resources.COMMENTS,
      Resources.MEMBERS,
    ],
    actions: {}
  }
}

export {
  ROLE_PERMISSIONS
}