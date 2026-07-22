import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class ProjectNotExistsException extends BusinessException {
  constructor() {
    super('Projeto não encontrado.', HttpStatus.NOT_FOUND);
  }
}
