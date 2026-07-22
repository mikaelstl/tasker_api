import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/** Regra de negócio conhecida que não corresponde a outro status específico. */
export class BusinessRuleException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
