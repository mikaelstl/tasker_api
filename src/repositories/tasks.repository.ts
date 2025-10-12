import { ApiResponse } from "@interfaces/response";
import { Task } from "@models/task.model";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { TaskCreateDTO } from "src/DTO/task.create.dto";
import { TaskListDTO } from "src/DTO/task.dto";

@Injectable()
export class TasksRepository {
  constructor (
    @InjectModel(Task) private readonly Tasks: typeof Task
  ) {}

  async create(data: TaskCreateDTO) {
    try {
      const task = await this.Tasks.create(
        {
          code: data.code,
          name: data.name,
          description: data.description,
          project: data.project,
          owner: data.owner,
          priority: data.priority,
          due_date: data.due_date
        }
      );

      return {
        data: task,
        error: false,
        message: `NEW TASK CREATED TO PROJECT`
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list(queries: TaskListDTO) {
    try {
      const tasks = await this.Tasks.findAll({
        where: queries
      });

      return tasks;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async find(code: string) {
    try {
      const task = await this.Tasks.findOne({
        where: {
          code: code
        }
      });

      if (!task) {
        throw new NotFoundException();
      }

      return task;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async edit(code: string, update: any): Promise<any> {
    try {
      const response = await this.Tasks.update(
        update,
        {
          where: {
            code: code
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
      const result = await this.Tasks.destroy({
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