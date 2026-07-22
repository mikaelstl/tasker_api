import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from 'src/common/errors/business.exception';
import { ApiError } from 'src/common/interfaces/Error';

/** Trata somente falhas publicas e esperadas da aplicacao. */
@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();
    const body: ApiError = {
      status,
      errors: [{
        level: 'warning',
        message: this.getPublicMessage(exception),
        error: 'BUSINESS_ERROR',
      }],
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    response.status(status).json(body);
  }

  private getPublicMessage(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const message = response.message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.filter((item): item is string => typeof item === 'string').join(' ');
      }
    }

    return exception.message || 'Não foi possível processar a solicitação.';
  }
}
