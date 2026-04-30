import { HttpException } from "@nestjs/common";

export class WithoutUsernameException extends HttpException {
  constructor() {
    super('user must have a username', 400);
  }
}