import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationException } from 'src/common/errors/validation.exception';
import { ApiError } from 'src/common/interfaces/Error';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): Response {
    const context = host.switchToHttp();
    const res = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const exceptionResponse = exception.getResponse();
    const rawMessages = typeof exceptionResponse === 'object'
      && exceptionResponse !== null
      && 'message' in exceptionResponse
      ? exceptionResponse.message
      : exception.message;
    const normalizedMessages = (Array.isArray(rawMessages) ? rawMessages : [rawMessages])
      .map((message) => this.normalizeMessage(message));
    const messages = normalizedMessages.length > 0
      ? normalizedMessages
      : ['Os dados informados são inválidos.'];

    const error: ApiError = {
      status: HttpStatus.BAD_REQUEST,
      errors: messages.map((message) => ({
        level: 'validation',
        message,
        error: 'VALIDATION_ERROR',
      })),
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    return res.status(error.status).json(error);
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message !== 'string') {
      return 'Os dados informados são inválidos.';
    }

    const forbiddenProperty = message.match(/^property (.+) should not exist$/);

    return forbiddenProperty
      ? `A propriedade ${forbiddenProperty[1]} não é permitida.`
      : message;
  }
}
