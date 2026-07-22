import { ResourceNotFoundException } from './not-found.exception';

export class UserNotFoundException extends ResourceNotFoundException {
  constructor() {
    super('Usuário');
  }
}
