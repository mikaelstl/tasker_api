import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AuditAction, AuditResource } from 'generated/prisma';

export class FindAuditLogsQuery {
  @IsOptional()
  @IsString()
  readonly actorkey?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  readonly action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditResource)
  readonly resource?: AuditResource;

  @IsOptional()
  @IsString()
  readonly resourcekey?: string;

  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 20;
}
