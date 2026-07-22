import { ConflictException } from './conflict.exception';

export class AlreadyExistsException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}
