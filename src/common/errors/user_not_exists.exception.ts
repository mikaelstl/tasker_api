import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotExistsException extends HttpException {
  constructor() {
    super('Usuário não encontrado.', 404);
  }
}
