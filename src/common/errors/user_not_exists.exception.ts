import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotExistsException extends HttpException {
  constructor() {
    super('user not exists', 404);
  }
}