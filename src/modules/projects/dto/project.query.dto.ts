import { ProjectStage } from "@modules/projects/dto/project.dto";

export interface ProjectQueryDTO {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly ownerkey?: string;
  readonly managerkey?: string;
  readonly deadline?: Date;
  readonly stage?: ProjectStage;
  readonly delayed?: boolean;
}
