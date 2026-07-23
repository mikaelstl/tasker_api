import { $Enums } from "generated/prisma";

export interface TaskDTO {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly projectkey: string;
  readonly ownerkey: string | null;
  readonly stage: $Enums.TaskStage;
  readonly priority: $Enums.TaskPriority;
  readonly deadline: Date;
  readonly delayed: boolean;
}
