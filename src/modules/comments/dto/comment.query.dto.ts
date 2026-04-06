import { $Enums } from "generated/prisma";

export interface CommentQueryDTO {
  readonly id?: string;
  readonly projectkey?: string;
  readonly ownerkey?: string;
  readonly date?: Date;
}