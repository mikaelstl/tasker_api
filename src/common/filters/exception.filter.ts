import { ApiError } from "src/common/interfaces/Error";
import { ArgumentsHost, ExceptionFilter, HttpException, Catch, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(ex: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = ex instanceof HttpException;
    const status = isHttpException
      ? ex.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const defaultMessages: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.BAD_REQUEST]: 'Solicitação inválida.',
      [HttpStatus.UNAUTHORIZED]: 'Não autorizado.',
      [HttpStatus.FORBIDDEN]: 'Acesso negado.',
      [HttpStatus.NOT_FOUND]: 'Recurso não encontrado.',
      [HttpStatus.CONFLICT]: 'Conflito ao processar a solicitação.',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Não foi possível processar os dados informados.',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor.',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Serviço indisponível.',
    };
    const exceptionResponse = isHttpException
      ? ex.getResponse()
      : null;
    const responseError = (
      typeof exceptionResponse === 'object'
      && exceptionResponse !== null
      && 'error' in exceptionResponse
    )
      ? exceptionResponse.error
      : null;
    const rawMessage = isHttpException
      ? ex.message
      : defaultMessages[HttpStatus.INTERNAL_SERVER_ERROR];
    const message = (
      rawMessage?.startsWith('Cannot ')
      || rawMessage === responseError
      || (
        typeof responseError === 'string'
        && rawMessage?.startsWith(responseError)
      )
      || rawMessage === HttpStatus[status]
    )
      ? defaultMessages[status] ?? 'Não foi possível processar a solicitação.'
      : rawMessage ?? 'Não foi possível processar a solicitação.';
    
    console.log(message);

    const error: ApiError = {
      status: status,
      errors: [{
        level: 'error',
        message: message,
        error: defaultMessages[status] ?? 'Erro ao processar a solicitação.'
      }],
      timestamp: new Date().toISOString(),
      path: request.url
    };

    response
      .status(status)
      .json(error)
  }
}
