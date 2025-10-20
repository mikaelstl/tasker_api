import { TaskPriority, TaskStage } from "@models/task.model";

export interface TaskCreateDTO {
  readonly name: string;
  readonly description: string;
  readonly project: string;
  readonly owner: string;
  readonly priority: TaskPriority;
  readonly due_date: string;
}