import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class UserNotExistsException extends BusinessException {
  constructor() {
    super('Usuário não encontrado.', HttpStatus.NOT_FOUND);
  }
}
