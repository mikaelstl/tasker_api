import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TasksRepository } from "./tasks.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";

@Injectable()
export class TasksService implements AccessValidator {
  private logger: Logger = new Logger('TasksService');
  
  constructor (
    private readonly repository: TasksRepository
  ) {}

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          ownerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to verify task ownership.", err);
      return false;
    }
  }
}