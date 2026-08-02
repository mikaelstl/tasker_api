import { IsOptional, Matches } from "class-validator";

export class ProjectStatsQueryDTO {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month deve estar no formato YYYY-MM.',
  })
  readonly month?: string;
}
