import { Actions } from "@enums/Actions.enum";
import { OrgRole } from "generated/prisma";

// Context {
//   user: User
//   profile: Profile
//   organization?: Organization
//   affiliation?: OrganizationMember
//   resource?: any
// }

const POLICIES = new Map<Actions, (ctx: any)=>boolean>();

// POLICIES.set(
// )