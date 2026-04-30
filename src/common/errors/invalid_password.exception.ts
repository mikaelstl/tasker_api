import { HttpException } from "@nestjs/common";

export class InvalidPasswordException extends HttpException {
  constructor(message: string, status: number) {
    super(message, status)
  }
}