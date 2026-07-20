import { IsDateString, IsOptional } from "class-validator";

export class ProjectStatsQueryDTO {
  @IsOptional()
  @IsDateString()
  readonly cutoffAt?: string;
}
