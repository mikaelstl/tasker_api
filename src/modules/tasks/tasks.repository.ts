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

  constructor(
    // @InjectModel(Task) private readonly Tasks: typeof Task
    private readonly prisma: PrismaService
  ) { }

  private generateCode(): string {
    const prefix = 'TSK-';
    const code = this.nanoid();

    return prefix.concat(code);
  }

  async create(data: TaskCreateDTO): Promise<TaskDTO> {
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
  }

  async list(queries: TaskQueryDTO): Promise<TaskDTO[]> {
    const { ownerkey, ...filters } = queries;

    const tasks = await this.prisma.task.findMany({
      where: filters,
      include: {
        owner: true
      }
    });

    return tasks;
  }

  async find(key: string, query?: TaskQueryDTO): Promise<TaskDTO> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: key,
        ...query
      },
      include: {
        owner: true
      }
    });

    if (!task) {
      throw new NotFoundException();
    }

    return task;
  }

  async edit(code: string, update: any): Promise<TaskDTO> {
    const response = await this.prisma.task.update({
      data: update,
      where: {
        code: code
      },
    });

    return response;
  }

  async delete(key: string): Promise<TaskDTO> {
    const result = await this.prisma.task.delete({
      where: {
        id: key
      }
    });

    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }

  async exists(key: string, query: TaskQueryDTO): Promise<boolean> {
    const result = await this.prisma.task.count({
      where: {
        id: key,
        ...query
      }
    });

    return result > 0;
  }
}