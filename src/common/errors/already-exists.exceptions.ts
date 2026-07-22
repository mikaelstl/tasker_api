import { ConflictException } from './conflict.exception';

export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super('Este e-mail já está cadastrado.');
  }
}

export class UsernameAlreadyExistsException extends ConflictException {
  constructor() {
    super('Já existe um usuário com este nome de usuário.');
  }
}
