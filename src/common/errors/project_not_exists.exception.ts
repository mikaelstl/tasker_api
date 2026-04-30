import { HttpException, HttpStatus } from "@nestjs/common";

export class ProjectNotExistsException extends HttpException {
  constructor() {
    super('PROJECT NOT EXISTS', 404);
  }
}