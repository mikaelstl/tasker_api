import { $Enums } from "generated/prisma"

export type EditProjectDTO = {
  title?: string,
  description?: string,
  due_date?: Date,
  progress?: $Enums.ProjectProgress
}