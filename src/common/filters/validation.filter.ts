import { ApiError } from 'src/common/interfaces/Error';
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(ex: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse: any = ex.getResponse();

    const logger = new Logger('ValidationExceptionFilter');
    logger.warn(exceptionResponse.message);

    logger.log(exceptionResponse)

    const errors: string[] = exceptionResponse.message;

    const resp: ApiError = {
      status: 400,
      errors: errors.map(
        err => {
          return { level: 'warning', message: err}
        }
      ),
      path: request.url,
      timestamp: new Date().toISOString()
    };

    response.status(resp.status).json(resp);
  }
}