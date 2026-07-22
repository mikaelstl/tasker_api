import { Injectable } from '@nestjs/common';
import { TasksRepository } from "./tasks.repository";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';

@Injectable()
export class TasksService implements AccessValidator {
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
      throw new InternalException('Falha ao verificar a propriedade da tarefa.', err);
    }
  }
}
