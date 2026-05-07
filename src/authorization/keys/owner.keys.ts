import { BaseActions, EnhancedActions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";

type OwnerManageResourcesKeys = `OWNER:${Resources.AFFILIATIONS}:${EnhancedActions}`;

type OwnerBaseResourcesKeys = `OWNER:${Resources}:${BaseActions}`;

export type OwnerResourceAccessKeys = OwnerBaseResourcesKeys | OwnerManageResourcesKeys;
