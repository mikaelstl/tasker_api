import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/** Base para recursos conhecidos que não existem ou não estão visíveis. */
export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, message?: string) {
    super(message ?? `${resource} não encontrado.`, HttpStatus.NOT_FOUND);
  }
}
