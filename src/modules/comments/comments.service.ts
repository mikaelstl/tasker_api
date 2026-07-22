import { Injectable } from '@nestjs/common';
import { CommentsRepository } from "./comments.repository";
import { InternalException } from 'src/common/errors/internal.exception';

@Injectable()
export class CommentsService {
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
      throw new InternalException('Falha ao verificar a propriedade do comentário.', err);
    }
  }
}
