import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { StatsPeriodType } from "generated/prisma";

export class GenerateStatsReportDTO {
  @IsOptional()
  @IsEnum(StatsPeriodType)
  readonly periodType?: StatsPeriodType;

  @IsOptional()
  @IsDateString()
  readonly cutoffAt?: string;
}
