import { ApiResponse } from "@interfaces/response";
import { Checkpoint } from "@models/checkpoint.model";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CheckpointCreateDTO } from "src/DTO/checkpoint.create.dto";
import { TaskListDTO } from "src/DTO/task.dto";

@Injectable()
export class CheckpointsRepository {
  constructor (
    @InjectModel(Checkpoint) private readonly Checkpoints: typeof Checkpoint
  ) {}

  async create(data: CheckpointCreateDTO) {
    try {
      const checkpoint = await this.Checkpoints.create(data);

      return {
        data: checkpoint,
        error: false,
        message: `NEW CHECKPOINT DEFINED`
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list(queries: TaskListDTO) {
    try {
      const checkpoints = await this.Checkpoints.findAll({
        where: queries
      });

      return checkpoints;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async find(id: string) {
    try {
      const checkpoint = await this.Checkpoints.findOne({
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

  async edit(id: string, update: any): Promise<any> {
    try {
      const response = await this.Checkpoints.update(
        update,
        {
          where: {
            id: id
          },
          returning: true
        },
      );
      
      return {
        data: response,
        error: false,
        message: "CHANGED"
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(key: string): Promise<any> {
    try {
      const result = await this.Checkpoints.destroy({
        where: {
          id: key
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return {
        data: result,
        error: false,
        message: 'REMOVED'
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}