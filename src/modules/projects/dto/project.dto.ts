import { $Enums } from "generated/prisma";

export enum ProjectProgress {
  PENDING,
  IN_PROGRESS,
  PAUSED,
  COMPLETED,
}

export interface ProjectDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly ownerkey?: string;
  readonly due_date?: Date;
  readonly progress?: $Enums.ProjectProgress;
}