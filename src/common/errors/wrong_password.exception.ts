import { UnauthorizedException } from './unauthorized.exception';

export class WrongPasswordException extends UnauthorizedException {
  constructor() {
    super('Senha incorreta. Informe a senha correta ou altere sua senha.');
  }
}
