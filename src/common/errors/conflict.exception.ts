import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/** Conflito conhecido entre a operação solicitada e o estado atual. */
export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
