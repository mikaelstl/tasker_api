import { BaseActions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";

type ManagerReadonlyResources = Resources.ORGANIZATIONS | Resources.AFFILIATIONS | Resources.PROJECTS;

type ManagerReadonlyResourcesKeys = `MANAGER:${ManagerReadonlyResources}:${BaseActions.SEEK}`;

type ManagerAccessResources = Resources.TASKS | Resources.COMMENTS | Resources.EVENTS | Resources.MEMBERS;

type ManagerResourcesKeys = `MANAGER:${ManagerAccessResources}:${BaseActions}`

export type ManagerResourceAccessKeys = ManagerReadonlyResourcesKeys | ManagerResourcesKeys;