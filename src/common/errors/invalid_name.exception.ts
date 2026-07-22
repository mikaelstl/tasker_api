import { ValidationException } from './validation.exception';

export class InvalidNameException extends ValidationException {
  constructor(message: string) {
    super(message);
  }
}
