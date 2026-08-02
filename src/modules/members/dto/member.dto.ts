import { $Enums } from "generated/prisma";
import type { MemberRole } from "./role.dto";
import { UserDTO } from "@modules/users/dto/user.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";

export interface MemberDTO {
  readonly id: string;
  readonly projectkey: string;
  readonly userkey: string;
  readonly created_at: Date;
  readonly updated_at: Date;
  
  readonly user?: UserDTO;
  readonly tasks?: TaskDTO[];
  readonly role?: MemberRole;
}