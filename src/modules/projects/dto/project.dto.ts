import { MemberDTO } from "@modules/members/dto/member.dto";

export enum ProjectStage {
  STARTED = "STARTED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  DELAYED = "DELAYED",
}

export interface ProjectDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly ownerkey?: string;
  readonly deadline?: Date;
  readonly stage?: ProjectStage;

  readonly members?: MemberDTO;
}
