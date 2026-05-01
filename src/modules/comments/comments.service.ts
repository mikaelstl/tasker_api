import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CommentsRepository } from "./comments.repository";

@Injectable()
export class CommentsService {
  private readonly logger: Logger = new Logger('CommentsService');
  
  constructor (
    private readonly repository: CommentsRepository
  ) {}

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          ownerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to verify comment ownership.", err);
      return false;
    }
  }
}