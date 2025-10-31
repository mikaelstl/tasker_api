import { $Enums } from "generated/prisma";
import type { TaskDTO } from "../task/task.dto";
import type { UserDTO } from "../user/user.dto";
import type { MemberRole } from "./role.dto";

export interface MemberDTO {
  readonly id: string;
  readonly projectkey: string;
  readonly userkey: string;
  readonly user: UserDTO;
  readonly role: $Enums.MemberRole;
  readonly tasks: TaskDTO[];
}