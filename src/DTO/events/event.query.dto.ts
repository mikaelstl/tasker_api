import { $Enums } from "generated/prisma";

export interface EventQueryDTO {
  readonly id?: string;
  readonly title?: string;
  readonly projectkey?: string;
  readonly date?: Date;
}