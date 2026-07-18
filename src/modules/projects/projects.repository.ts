import { ProjectNotExistsException } from "src/common/errors/project_not_exists.exception";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { EditProjectDTO } from "@modules/projects/dto/edit.dto";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";

@Injectable()
export class ProjectRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  private toProjectDTO(project: any): ProjectDTO {
    if (!project) {
      return project;
    }

    const { progress, due_date, ...rest } = project;

    return {
      ...rest,
      deadline: due_date,
      stage: progress,
    };
  }

  private toProjectWhere(queries: ProjectQueryDTO) {
    const { stage, deadline, ...rest } = queries;

    return {
      ...rest,
      due_date: deadline,
      progress: stage,
    };
  }

  async projectExists(id: string) {
    const exists = await this.prisma.project.findUnique({
      where: {
        id: id
      }
    });

    if (!exists) {
      throw new NotFoundException("This project don't exists.")
    }

    return;
  }

  async create(data: CreateProjectDTO): Promise<ProjectDTO> {
    const result = await this.prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        ownerkey: data.ownerkey,
        due_date: data.deadline
      },
    });

    return this.toProjectDTO(result);
  };

  async list(queries: ProjectQueryDTO) {
    const projects = await this.prisma.project.findMany({
      where: this.toProjectWhere(queries),
    });
    return projects.map((project) => this.toProjectDTO(project));
  };

  async listByMember(key: string): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userkey: key
          }
        },
      },
      select: {
        id: true,
        title: true,
        progress: true,
        due_date: true
      }
    });

    return projects.map((project) => this.toProjectDTO(project));
  };

  async listByOrganizer(key: string): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        owner: {
          ownerkey: {
            equals: key
          }
        },
      },
    });

    return projects.map((project) => this.toProjectDTO(project));
  };

  async listByManager(key: string): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userkey: key
          }
        },
      },
      select: {
        id: true,
        title: true,
        progress: true,
        due_date: true
      }
    });

    return projects.map((project) => this.toProjectDTO(project));
  };

  async find(key: string, query?: ProjectQueryDTO) {
    const projects = await this.prisma.project.findUnique({
      where: {
        id: key,
        ...this.toProjectWhere(query ?? {})
      },
      include: {
        members: true
      }
    })

    if (!projects) {
      throw new ProjectNotExistsException();
    }

    return this.toProjectDTO(projects);
  };

  async edit(key: string, update: EditProjectDTO): Promise<ProjectDTO> {
    await this.projectExists(key);

    const result = await this.prisma.project.update({
      where: {
        id: key
      },
      data: {
        title: update.title,
        description: update.description,
        due_date: update.deadline,
        progress: update.stage,
      },
    });

    return this.toProjectDTO(result);
  }

  async delete(id: string) {
    const response = await this.prisma.project.delete({
      where: {
        id: id
      }
    });

    if (!response) {
      throw new NotFoundException();
    }

    return response;
  };

  async exists(key: string, query: ProjectQueryDTO): Promise<boolean> {
    const result = await this.prisma.organization.count({
      where: {
        id: key,
        ...this.toProjectWhere(query)
      }
    });

    return result > 0;
  }
}
