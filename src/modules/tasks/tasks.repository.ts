import { Injectable, NotFoundException } from "@nestjs/common";
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

  private toTaskDTO(task: any): TaskDTO {
    return task;
  }

  private toTaskWhere(queries: TaskQueryDTO) {
    return queries;
  }

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
        deadline: data.deadline
      }
    });

    return this.toTaskDTO(task);
  }

  async list(queries: TaskQueryDTO): Promise<TaskDTO[]> {
    const tasks = await this.prisma.task.findMany({
      where: this.toTaskWhere(queries),
      include: {
        owner: true
      }
    });

    return tasks.map((task) => this.toTaskDTO(task));
  }

  async find(key: string, query?: TaskQueryDTO): Promise<TaskDTO> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: key,
        ...this.toTaskWhere(query ?? {})
      },
      include: {
        owner: true
      }
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    return this.toTaskDTO(task);
  }

  async edit(code: string, update: any): Promise<TaskDTO> {
    const response = await this.prisma.task.update({
      data: {
        name: update.name,
        description: update.description,
        priority: update.priority,
        stage: update.stage,
        deadline: update.deadline,
      },
      where: {
        code: code
      },
    });

    return this.toTaskDTO(response);
  }

  async delete(key: string): Promise<TaskDTO> {
    const result = await this.prisma.task.delete({
      where: {
        id: key
      }
    });

    if (!result) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    return result;
  }

  async exists(key: string, query: TaskQueryDTO): Promise<boolean> {
    const result = await this.prisma.task.count({
      where: {
        id: key,
        ...this.toTaskWhere(query)
      }
    });

    return result > 0;
  }
}
