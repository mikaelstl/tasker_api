import { ApiError } from '@interfaces/error';
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError, UniqueConstraintError, ValidationError } from 'sequelize';

@Catch(UniqueConstraintError)
export class UniqueConstraintViolationFilter implements ExceptionFilter {
  catch(ex: UniqueConstraintError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errors = ex.errors;

    const resp: ApiError = {
      status: 400,
      errors: errors.map(
        err => {
          const key = err.path.replace(/\b\w/g, c => c.toUpperCase());
          new Logger().warn(`${key} already registered`);
          return { level: 'error', message: `${key} already registered`}
        }
      ),
      path: request.url,
      timestamp: new Date().toISOString()
    };

    response.status(400).json(resp);
  }
}