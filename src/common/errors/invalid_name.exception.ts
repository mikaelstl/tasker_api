import { HttpException } from "@nestjs/common";

export class InvalidNameException extends HttpException {
  constructor(message: string) {
    super(message, 400);
  }
}