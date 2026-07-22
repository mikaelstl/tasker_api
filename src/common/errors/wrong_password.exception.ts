import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class WrongPasswordException extends BusinessException {
  constructor() {
    super('Senha incorreta.', HttpStatus.UNAUTHORIZED);
  }
}
