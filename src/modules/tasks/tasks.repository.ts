import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { TaskCreateDTO } from "@modules/tasks/dto/task.create.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { TaskQueryDTO } from "@modules/tasks/dto/task.query.dto";
import { Prisma, TaskStage } from "generated/prisma";
import { InternalException } from 'src/common/errors/internal.exception';
import { TaskNotFoundException } from 'src/common/errors/resource-not-found.exceptions';
import { TaskCodeGenerationConflictException } from 'src/common/errors/task-business.exceptions';
import { EditTaskDTO } from './dto/edit.dto';
import { DateTime } from 'luxon';

@Injectable()
export class TasksRepository {
  private readonly maxCodeGenerationAttempts = 5;

  constructor(
    // @InjectModel(Task) private readonly Tasks: typeof Task
    private readonly prisma: PrismaService
  ) { }

  private async generateCode(projectkey: string): Promise<string> {
    const prefix = 'TSK-';
    const tasks = await this.prisma.task.findMany({
      where: {
        projectkey,
        code: {
          startsWith: prefix,
        },
      },
      select: {
        code: true,
      },
    });

    const highestSequence = tasks.reduce((highest, task) => {
      const match = task.code.match(/^TSK-(\d+)$/);
      const sequence = match ? Number(match[1]) : 0;

      return Math.max(highest, sequence);
    }, 0);

    return `${prefix}${String(highestSequence + 1).padStart(3, '0')}`;
  }

  async create(data: TaskCreateDTO): Promise<TaskDTO> {
    for (let attempt = 0; attempt < this.maxCodeGenerationAttempts; attempt += 1) {
      try {
        const task = await this.prisma.$transaction(async (transaction) => {
          const task = await transaction.task.create({
            data: {
              code: await this.generateCode(data.project),
              name: data.name,
              description: data.description,
              projectkey: data.project,
              ownerkey: data.owner,
              priority: data.priority,
              deadline: data.deadline
            }
          });

          await transaction.project.updateMany({
            where: {
              id: data.project,
              started_at: null
            },
            data: {
              started_at: task.created_at
            }
          });

          return task;
        });

        return task;
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
    const { ownerkey, ...query } = queries;

    const tasks = await this.prisma.task.findMany({
      where: {
        owner: {
          userkey: ownerkey
        },
        ...query,
      },
      include: {
        owner: true
      }
    });

    return tasks;
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

    return task;
  }

  async findEditContext(
    projectkey: string,
    code: string,
    orgkey: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        projectkey,
        code,
        project: { orgkey },
      },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
        project: {
          include: {
            org: true,
            manager: true,
          },
        },
      },
    });

    if (!task) {
      throw new TaskNotFoundException();
    }

    return task;
  }

  async edit(
    projectkey: string,
    code: string,
    update: EditTaskDTO,
  ): Promise<TaskDTO> {
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
      ? DateTime.fromJSDate(update.deadline).toJSDate()
      : current.deadline;
    const stage = update.stage ?? current.stage;
    const stageChanged = update.stage !== undefined
      && update.stage !== current.stage;
    const becameStarted = stageChanged
      && current.stage === TaskStage.PENDING
      && update.stage === TaskStage.STARTED;
    const becameDone = stageChanged && update.stage === TaskStage.DONE;
    const stageChangedAt = DateTime.now().toJSDate();

    const becameDelayed = DateTime.fromJSDate(deadline).toMillis() < DateTime.now().toMillis()
      && (
        stage !== TaskStage.DONE
        || current.stage !== TaskStage.DONE
        || (
          current.done_at !== null
          && DateTime.fromJSDate(current.done_at).toMillis() > DateTime.fromJSDate(deadline).toMillis()
        )
      );

    const response = await this.prisma.task.update({
      data: {
        name: update.name,
        description: update.description,
        priority: update.priority,
        stage: update.stage,
        deadline: update.deadline,
        ownerkey: update.ownerkey,
        delayed: current.delayed || becameDelayed,
        started_at: becameStarted
          ? stageChangedAt
          : becameDone && (!current.started_at || DateTime.fromJSDate(current.started_at).toMillis() === 0)
            ? stageChangedAt
            : undefined,
        done_at: becameDone ? stageChangedAt : undefined,
      },
      where: {
        projectkey_code: {
          projectkey,
          code
        }
      },
      include: { owner: true },
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
      throw new TaskNotFoundException();
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

  async memberBelongsToProject(
    memberkey: string,
    projectkey: string,
  ): Promise<boolean> {
    return (await this.prisma.member.count({
      where: {
        id: memberkey,
        projectkey,
      },
    })) > 0;
  }

  async projectBelongsToOrganization(
    projectkey: string,
    orgkey: string,
  ): Promise<boolean> {
    return (await this.prisma.project.count({
      where: {
        id: projectkey,
        orgkey,
      },
    })) > 0;
  }

  async isOwnedByUser(
    taskkey: string,
    username: string,
  ): Promise<boolean> {
    return (await this.prisma.task.count({
      where: {
        id: taskkey,
        owner: {
          user: {
            userkey: username,
          },
        },
      },
    })) > 0;
  }

  async isOwnedByUserAndCode(
    projectkey: string,
    code: string,
    username: string,
  ): Promise<boolean> {
    return (await this.prisma.task.count({
      where: {
        projectkey,
        code,
        owner: {
          user: {
            userkey: username,
          },
        },
      },
    })) > 0;
  }
}
