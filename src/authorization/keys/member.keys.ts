import { BaseActions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";

type MemberReadonlyResources = Resources.ORGANIZATIONS | Resources.AFFILIATIONS | Resources.PROJECTS | Resources.EVENTS | Resources.MEMBERS

type MemberReadonlyResourcesKeys = `MEMBER:${MemberReadonlyResources}:${BaseActions.SEEK}`;

type MemberResourcesKeys = `MEMBER:${Resources.TASKS | Resources.COMMENTS}:${BaseActions}`

export type MemberResourceAccessKeys = MemberReadonlyResourcesKeys | MemberResourcesKeys;