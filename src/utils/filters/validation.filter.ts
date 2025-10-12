import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse: any = exception.getResponse();

    const errors = exceptionResponse.message || exceptionResponse;

    response.status(400).json({
      statusCode: 400,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}