import { ValidationException } from './validation.exception';

export class UserUnnamedException extends ValidationException {
  constructor() {
    super('O usuário deve ter um nome.');
  }
}
