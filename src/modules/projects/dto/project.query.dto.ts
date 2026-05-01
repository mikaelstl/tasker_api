import { $Enums } from "generated/prisma";

export interface ProjectQueryDTO {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly ownerkey?: string;
  readonly managerkey?: string;
  readonly due_date?: Date;
  readonly progress?: $Enums.ProjectProgress;
}