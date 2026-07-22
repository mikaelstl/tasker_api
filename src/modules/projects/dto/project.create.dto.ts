import { ProjectPriority } from "generated/prisma";

export interface CreateProjectDTO {
  readonly title: string;
  readonly description: string;
  readonly orgkey: string;
  readonly priority?: ProjectPriority;
  readonly deadline: string;
}
