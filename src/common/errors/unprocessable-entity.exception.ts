import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/** Regra válida em formato, mas que não pode ser processada semanticamente. */
export class UnprocessableEntityBusinessException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
