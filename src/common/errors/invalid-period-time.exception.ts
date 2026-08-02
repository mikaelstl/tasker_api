import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class InvalidPeriodTime extends BusinessException {
  constructor() {
    super(
      'Período inválido. Selecione o mês atual ou meses anteriores.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
