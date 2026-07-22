import { ValidationException } from './validation.exception';

export class InvalidPasswordException extends ValidationException {
  constructor(message: string) {
    super(message);
  }
}
