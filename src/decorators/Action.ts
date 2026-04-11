import { SetMetadata } from "@nestjs/common";
import { Permission } from "@permissions/type/permissions.type";

export const ACTION_KEY = 'action_key';
export const Action = (action: Permission) => SetMetadata(ACTION_KEY, action);