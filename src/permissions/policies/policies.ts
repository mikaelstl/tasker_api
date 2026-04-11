import { ABACSubject } from "@interfaces/ABACPayload";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { Permission } from "@permissions/type/permissions.type";
import { OrgRole } from "generated/prisma";

// Context {
//   user: User
//   profile: Profile
//   organization?: Organization
//   affiliation?: OrganizationMember
//   resource?: any
// }

const POLICIES = new Map<Permission, (ctx: ABACSubject)=>boolean>();

POLICIES.set(
  'tasks.edit',
  (ctx) => {
    const { userkey, role } = ctx;
    const { task } = ctx;
    const { project } = ctx;

    if (userkey === task.ownerkey) {
      return true
    }

    if (
      role === OrgRole.MANAGER &&
      userkey === project.description
    ) {
      return true
    }

    return true;
  }
)