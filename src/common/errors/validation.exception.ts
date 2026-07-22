import { BadRequestException } from '@nestjs/common';

/** Excecao exclusiva para dados de entrada invalidos. */
export class ValidationException extends BadRequestException {
  constructor(messages: string | string[]) {
    const normalizedMessages = Array.isArray(messages) ? messages : [messages];

    super({
      statusCode: 400,
      error: 'Validation Error',
      message: normalizedMessages,
    });
  }
}
