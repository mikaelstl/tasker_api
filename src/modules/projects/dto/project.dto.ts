import { MemberDTO } from "@modules/members/dto/member.dto";
import { ProjectStage } from "generated/prisma";

export { ProjectStage };

export interface ProjectDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly ownerkey?: string;
  readonly deadline?: Date;
  readonly stage?: ProjectStage;

  readonly members?: MemberDTO[];
}
