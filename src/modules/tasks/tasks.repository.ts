import { Injectable } from '@nestjs/common';
import { customAlphabet } from "nanoid";
import { PrismaService } from "src/database/prisma.service";
import { TaskCreateDTO } from "@modules/tasks/dto/task.create.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { TaskQueryDTO } from "@modules/tasks/dto/task.query.dto";
import { Prisma, TaskStage } from "generated/prisma";
import { InternalException } from 'src/common/errors/internal.exception';
import { TaskNotFoundException } from 'src/common/errors/resource-not-found.exceptions';
import { TaskCodeGenerationConflictException } from 'src/common/errors/task-business.exceptions';

@Injectable()
export class TasksRepository {
  private readonly maxCodeGenerationAttempts = 5;

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
    for (let attempt = 0; attempt < this.maxCodeGenerationAttempts; attempt += 1) {
      try {
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
      } catch (error) {
        const codeCollision = error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === 'P2002';

        if (!codeCollision) {
          throw new InternalException('Falha ao criar a tarefa.', error);
        }
      }
    }

    throw new TaskCodeGenerationConflictException();
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

  async find(projectkey: string, code: string): Promise<TaskDTO> {
    const task = await this.prisma.task.findUnique({
      where: {
        projectkey_code: {
          projectkey,
          code
        }
      },
      include: {
        owner: true
      }
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return this.toTaskDTO(task);
  }

  async edit(projectkey: string, code: string, update: any): Promise<TaskDTO> {
    const current = await this.prisma.task.findUnique({
      where: {
        projectkey_code: {
          projectkey,
          code
        }
      }
    });

    if (!current) {
      throw new TaskNotFoundException();
    }

    const deadline = update.deadline
      ? new Date(update.deadline)
      : current.deadline;
    const stage = update.stage ?? current.stage;
    const becameDelayed = deadline.getTime() < Date.now()
      && (
        stage !== TaskStage.DONE
        || current.stage !== TaskStage.DONE
        || (
          current.done_at !== null
          && current.done_at.getTime() > deadline.getTime()
        )
      );

    const response = await this.prisma.task.update({
      data: {
        name: update.name,
        description: update.description,
        priority: update.priority,
        stage: update.stage,
        deadline: update.deadline,
        delayed: current.delayed || becameDelayed
      },
      where: {
        projectkey_code: {
          projectkey,
          code
        }
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
      throw new TaskNotFoundException();
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
