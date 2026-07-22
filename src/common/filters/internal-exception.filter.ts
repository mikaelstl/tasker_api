import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { inspect } from 'node:util';
import { ApiError } from 'src/common/interfaces/Error';
import { InternalException } from 'src/common/errors/internal.exception';

/** Ultima barreira: registra a falha tecnica e nao expoe seus detalhes. */
@Catch()
export class InternalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(InternalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const stack = exception instanceof Error ? exception.stack : undefined;
    const cause = exception instanceof InternalException
      ? ` | cause: ${inspect(exception.cause, { depth: 5 })}`
      : '';
    const description = (exception instanceof Error
      ? `${exception.name}: ${exception.message}`
      : inspect(exception, { depth: 5 })) + cause;

    this.logger.error(
      `${request.method} ${request.originalUrl ?? request.url} - ${description}`,
      stack,
    );

    const body: ApiError = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errors: [{
        level: 'critical',
        message: 'Erro interno inesperado',
        error: 'INTERNAL_ERROR',
      }],
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    response.status(body.status).json(body);
  }
}
