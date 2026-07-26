import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class InviteUnavailableException extends BusinessException {
  constructor() {
    super('Convite inválido ou indisponível.', HttpStatus.GONE);
  }
}
