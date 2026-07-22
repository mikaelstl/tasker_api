import { ProjectPriority, ProjectStage } from "@modules/projects/dto/project.dto";

export interface ProjectQueryDTO {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly orgkey?: string;
  readonly managerkey?: string;
  readonly deadline?: Date;
  readonly stage?: ProjectStage;
  readonly priority?: ProjectPriority;
  readonly delayed?: boolean;
}
