import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { MembersRepository } from "./member.repository";

@Injectable()
export class MembersService implements AccessValidator {
  private readonly logger: Logger = new Logger('MembersService');

  constructor(
    private readonly repository: MembersRepository
  ) { }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    return false;
  }

  async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    return this.repository.participates(targetkey, subjectkey);
  }
}