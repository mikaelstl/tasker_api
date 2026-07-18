import { HttpException } from "@nestjs/common";

export class UserUnnamedException extends HttpException {
  constructor() {
    super('O usuário deve ter um nome.', 400);
  }
}
