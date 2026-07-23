import { $Enums } from "generated/prisma";

export interface EditTaskDTO {
  readonly name?: string;
  readonly description?: string;
  readonly priority?: $Enums.TaskPriority;
  readonly stage?: $Enums.TaskStage;
  readonly deadline?: Date;
  readonly ownerkey?: string | null;
}
