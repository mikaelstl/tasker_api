import { HttpException, HttpStatus } from '@nestjs/common';

export type BusinessHttpStatus =
  | HttpStatus.BAD_REQUEST
  | HttpStatus.UNAUTHORIZED
  | HttpStatus.FORBIDDEN
  | HttpStatus.NOT_FOUND
  | HttpStatus.CONFLICT
  | HttpStatus.UNPROCESSABLE_ENTITY;

/**
 * Excecao publica para uma regra de negocio conhecida e esperada.
 *
 * Falhas tecnicas (banco, rede, bugs etc.) nao devem ser convertidas para
 * esta classe: elas precisam chegar ao InternalExceptionFilter com a causa
 * original para que sejam registradas corretamente.
 */
export abstract class BusinessException extends HttpException {
  constructor(
    message: string,
    status: BusinessHttpStatus,
  ) {
    super(message, status);
  }
}
