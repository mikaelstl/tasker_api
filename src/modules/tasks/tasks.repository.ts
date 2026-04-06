import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { PrismaService } from "src/database/prisma.service";
import { TaskCreateDTO } from "@modules/tasks/dto/task.create.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { TaskQueryDTO } from "@modules/tasks/dto/task.query.dto";

@Injectable()
export class TasksRepository {
  private nanoid = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6
  );

  constructor (
    // @InjectModel(Task) private readonly Tasks: typeof Task
    private readonly prisma: PrismaService
  ) {}

  private generateCode(): string {
    const prefix =  'TSK-';
    const code = this.nanoid();

    return prefix.concat(code);
  }

  async create(data: TaskCreateDTO): Promise<TaskDTO> {
    try {
      const task = await this.prisma.task.create({
        data: {
          code: this.generateCode(),
          name: data.name,
          description: data.description,
          projectkey: data.project,
          ownerkey: data.owner,
          priority: data.priority,
          due_date: data.due_date
        }
      });

      return task;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async list(queries: TaskQueryDTO): Promise<TaskDTO[]> {
    const { ownerkey, ...filters } = queries;

    try {
      const tasks = await this.prisma.task.findMany({
        where: filters,
        include: {
          owner: true
        }
      });

      return tasks;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async find(code: string): Promise<TaskDTO> {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          code: code
        },
        include: {
          owner: true
        }
      });

      if (!task) {
        throw new NotFoundException();
      }

      return task;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async edit(code: string, update: any): Promise<TaskDTO> {
    try {
      const response = await this.prisma.task.update({
        data: update,
        where: {
          code: code
        },
      });
      
      return response;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(key: string): Promise<TaskDTO> {
    try {
      const result = await this.prisma.task.delete({
        where: {
          id: key
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}