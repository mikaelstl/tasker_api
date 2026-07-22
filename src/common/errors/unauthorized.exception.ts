import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export const UNAUTHORIZED_MESSAGE =
  'Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.';

/** Falha de autenticação: credencial ausente, inválida ou expirada. */
export class UnauthorizedException extends BusinessException {
  constructor(message: string = UNAUTHORIZED_MESSAGE) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
