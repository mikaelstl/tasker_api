import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export const ACCESS_DENIED_MESSAGE =
  'Você não tem permissão para realizar esta ação.';

/** Usuário autenticado, mas sem permissão para acessar o recurso. */
export class AccessDeniedException extends BusinessException {
  constructor(message: string = ACCESS_DENIED_MESSAGE) {
    super(message, HttpStatus.FORBIDDEN);
  }
}
