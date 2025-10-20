import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CheckpointCreateDTO } from "src/DTO/checkpoint/checkpoint.create.dto";
import { CommentCreateDTO } from "src/DTO/comment/comment.create.dto";
import { CommentDTO } from "src/DTO/comment/comment.dto";
import { TaskQueryDTO } from "src/DTO/task/task.query.dto";

@Injectable()
export class CheckpointsRepository {
  constructor (
    // @InjectModel(Checkpoint) private readonly Checkpoints: typeof Checkpoint
    private readonly prisma: PrismaService
  ) {}

  async create(data: CommentCreateDTO): Promise<CommentDTO> {
    try {
      const checkpoint = await this.prisma.comment.create({
        data: {
          content: data.content,
          date: data.date,
          projectkey: data.projectkey,
          ownerkey: data.ownerkey
        }
      });

      return checkpoint;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list(projectkey: string): Promise<CommentDTO[]> {
    try {
      const checkpoints = await this.prisma.comment.findMany({
        where: {
          projectkey: projectkey
        },
      });

      return checkpoints;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async find(id: string) {
    try {
      const checkpoint = await this.prisma.comment.findUnique({
        where: {
          id: id
        }
      });

      if (!checkpoint) {
        throw new NotFoundException();
      }

      return checkpoint;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async edit(id: string, update: any): Promise<CommentDTO> {
    try {
      const response = await this.prisma.comment.update({
        data: update,
        where: {
          id: id
        }
      });
      
      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(key: string): Promise<CommentDTO> {
    try {
      const result = await this.prisma.comment.delete({
        where: {
          id: key
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}