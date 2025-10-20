import { $Enums } from "generated/prisma";

export interface TaskCreateDTO {
  readonly name: string;
  readonly description: string;
  readonly project: string;
  readonly owner: string;
  readonly priority: $Enums.TaskPriority;
  readonly due_date: string;
}