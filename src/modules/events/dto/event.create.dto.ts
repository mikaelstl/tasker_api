import { EventCategory } from "generated/prisma";

export interface EventCreateDTO {
  readonly title: string;
  readonly project: string;
  readonly date: string;
  readonly category: EventCategory;
}