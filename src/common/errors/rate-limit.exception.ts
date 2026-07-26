import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class RateLimitException extends BusinessException {
  constructor() {
    super(
      'Muitas tentativas. Tente novamente em instantes.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
