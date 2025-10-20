import { $Enums } from "generated/prisma";

export interface TaskDTO {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly projectkey: string;
  readonly ownerkey: string;
  readonly stage: $Enums.TaskStage;
  readonly priority: $Enums.TaskPriority;
  readonly due_date: Date;
}