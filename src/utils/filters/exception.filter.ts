import { ApiError } from "@interfaces/error";
import { ArgumentsHost, ExceptionFilter, HttpException, Catch } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(ex: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getResponse<Request>();
    const status = ex.getStatus();
    const message = ex.message;

    const exception: ApiError = {
      status: status,
      errors: [{
        level: 'error',
        message: message
      }],
      timestamp: new Date().toISOString(),
      path: request.url
    };

    response
      .status(status)
      .json(exception)
  }
}