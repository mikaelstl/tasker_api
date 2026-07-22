import { ValidationException } from './validation.exception';

export class WithoutUsernameException extends ValidationException {
  constructor() {
    super('O usuário deve ter um nome de usuário.');
  }
}
