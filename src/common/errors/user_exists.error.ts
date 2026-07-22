import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class AlreadyExistsException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
