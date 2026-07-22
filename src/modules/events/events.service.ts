import { Injectable } from '@nestjs/common';
import { EventsRepository } from "./events.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';

@Injectable()
export class EventsService implements AccessValidator {
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
      throw new InternalException('Falha ao verificar o vínculo do evento.', err);
    }
  }
}
