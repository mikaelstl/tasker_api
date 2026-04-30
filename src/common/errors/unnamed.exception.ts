import { HttpException } from "@nestjs/common";

export class UserUnnamedException extends HttpException {
  constructor() {
    super('user must have a name', 400);
  }
}