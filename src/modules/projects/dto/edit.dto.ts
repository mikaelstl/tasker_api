import { ProjectPriority, ProjectStage } from "@modules/projects/dto/project.dto";

export type EditProjectDTO = {
  title?: string,
  description?: string,
  deadline?: Date,
  stage?: ProjectStage,
  priority?: ProjectPriority
}
