import { HttpException } from "@nestjs/common";

export class WithoutUsernameException extends HttpException {
  constructor() {
    super('O usuário deve ter um nome de usuário.', 400);
  }
}
