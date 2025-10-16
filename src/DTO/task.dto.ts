import { TaskPriority, TaskStage } from "@models/task.model";

export type TaskListDTO = {
  code?: string;
  name?: string;
  project?: string;
  owner?: {
    user: string
  };
  stage?: TaskStage;
  priority?: TaskPriority;
  due_date?: Date;
}


  