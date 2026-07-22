import {
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BusinessExceptionFilter } from './business-exception.filter';
import { InternalExceptionFilter } from './internal-exception.filter';
import { ValidationExceptionFilter } from './validation.filter';
import { ValidationException } from '../errors/validation.exception';
import { BusinessException } from '../errors/business.exception';
import { InternalException } from '../errors/internal.exception';

function httpHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request = {
    method: 'POST',
    url: '/users',
    originalUrl: '/users?active=true',
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('exception filters', () => {
  it('returns each input problem as a validation ApiError', () => {
    const { host, json, status } = httpHost();
    const exception = new ValidationException([
      'O e-mail deve ser informado.',
      'property admin should not exist',
    ]);

    new ValidationExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      status: 400,
      path: '/users?active=true',
      errors: [
        {
          level: 'validation',
          message: 'O e-mail deve ser informado.',
          error: 'VALIDATION_ERROR',
        },
        {
          level: 'validation',
          message: 'A propriedade admin não é permitida.',
          error: 'VALIDATION_ERROR',
        },
      ],
    }));
  });

  it('preserves the status and public message of a business error', () => {
    const { host, json, status } = httpHost();

    new BusinessExceptionFilter().catch(
      new BusinessException('Usuário não encontrado.', HttpStatus.NOT_FOUND),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      status: 404,
      errors: [{
        level: 'warning',
        message: 'Usuário não encontrado.',
        error: 'BUSINESS_ERROR',
      }],
    }));
  });

  it('hides internal details and logs the original error', () => {
    const { host, json, status } = httpHost();
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const cause = new Error('database password leaked');
    const exception = new InternalException('Falha ao consultar o banco.', cause);

    new InternalExceptionFilter().catch(exception, host);

    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('database password leaked'),
      exception.stack,
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      status: 500,
      errors: [{
        level: 'critical',
        message: 'Erro interno inesperado',
        error: 'INTERNAL_ERROR',
      }],
    }));
    expect(JSON.stringify(json.mock.calls)).not.toContain('database password leaked');

    logger.mockRestore();
  });
});
