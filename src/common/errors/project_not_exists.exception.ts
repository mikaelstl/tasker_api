import { HttpException, HttpStatus } from "@nestjs/common";

export class ProjectNotExistsException extends HttpException {
  constructor() {
    super('Projeto não encontrado.', 404);
  }
}
