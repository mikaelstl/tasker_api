import { HttpException } from "@nestjs/common";

export class AlreadyExistsException extends HttpException {
  constructor(private readonly menssage: string) {
    super(menssage, 400)
  }
}