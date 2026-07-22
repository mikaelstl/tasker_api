import { MemberDTO } from "@modules/members/dto/member.dto";
import { ProjectPriority, ProjectStage } from "generated/prisma";

export { ProjectPriority, ProjectStage };

export interface ProjectDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly orgkey?: string;
  readonly managerkey?: string | null;
  readonly deadline?: Date;
  readonly stage?: ProjectStage;
  readonly priority?: ProjectPriority;
  readonly delayed: boolean;

  readonly members?: MemberDTO[];
}
