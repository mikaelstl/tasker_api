import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EventsRepository } from "./events.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";

@Injectable()
export class EventsService implements AccessValidator {
  private readonly logger: Logger = new Logger('EventsService');

  constructor(
    private readonly repository: EventsRepository
  ) { }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          projectkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to verify project ownership.", err);
      return false;
    }
  }
}