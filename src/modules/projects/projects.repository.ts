import { ProjectNotFoundException } from "src/common/errors/project-not-found.exception";
import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { EditProjectDTO } from "@modules/projects/dto/edit.dto";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectDTO, ProjectStage } from "@modules/projects/dto/project.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";

@Injectable()
export class ProjectRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  private toProjectDTO(project: any): ProjectDTO {
    return project;
  }

  private toProjectWhere(queries: ProjectQueryDTO) {
    return queries;
  }

  async projectExists(id: string) {
    const exists = await this.prisma.project.findUnique({
      where: {
        id: id
      }
    });

    if (!exists) {
      throw new ProjectNotFoundException();
    }

    return;
  }

  async create(data: CreateProjectDTO): Promise<ProjectDTO> {
    const result = await this.prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        orgkey: data.orgkey,
        priority: data.priority,
        deadline: data.deadline
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

  async listByMember(
    affiliationkey: string,
    orgkey: string,
    queries: ProjectQueryDTO = {},
  ): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...this.toProjectWhere(queries),
        orgkey,
        members: {
          some: {
            userkey: affiliationkey
          }
        },
      }
    });

    return projects.map((project) => this.toProjectDTO(project));
  };

  async listByOrganizer(
    orgkey: string,
    queries: ProjectQueryDTO = {},
  ): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...this.toProjectWhere(queries),
        orgkey,
      },
    });

    return projects.map((project) => this.toProjectDTO(project));
  };

  async listByManager(
    affiliationkey: string,
    orgkey: string,
    queries: ProjectQueryDTO = {},
  ): Promise<ProjectDTO[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...this.toProjectWhere(queries),
        orgkey,
        AND: [
          { managerkey: affiliationkey },
          {
            members: {
              some: {
                userkey: affiliationkey
              }
            }
          }
        ],
      }
    });

    console.log("--- Projects ---");
    console.log(projects);

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
      throw new ProjectNotFoundException();
    }

    return this.toProjectDTO(projects);
  };

  async edit(
    key: string,
    orgkey: string,
    update: EditProjectDTO,
  ): Promise<ProjectDTO> {
    const current = await this.prisma.project.findUnique({
      where: {
        id: key,
        orgkey,
      },
    });

    if (!current) {
      throw new ProjectNotFoundException();
    }

    const deadline = update.deadline ?? current.deadline;
    const stage = update.stage ?? current.stage;
    const becameDelayed = deadline.getTime() < Date.now()
      && (
        stage !== ProjectStage.COMPLETED
        || current.stage !== ProjectStage.COMPLETED
        || (
          current.done_at !== null
          && current.done_at.getTime() > deadline.getTime()
        )
      );

    const result = await this.prisma.project.update({
      where: {
        id: key,
        orgkey,
      },
      data: {
        title: update.title,
        description: update.description,
        deadline: update.deadline,
        stage: update.stage,
        priority: update.priority,
        managerkey: update.managerkey,
        delayed: current.delayed || becameDelayed
      },
    });

    return this.toProjectDTO(result);
  }

  async delete(id: string, orgkey: string) {
    const response = await this.prisma.project.delete({
      where: {
        id,
        orgkey,
      }
    });

    if (!response) {
      throw new ProjectNotFoundException();
    }

    return response;
  };

  async exists(key: string, query: ProjectQueryDTO): Promise<boolean> {
    const result = await this.prisma.project.count({
      where: {
        id: key,
        ...this.toProjectWhere(query)
      }
    });

    return result > 0;
  }

  async isManagedByUser(
    projectkey: string,
    username: string,
    orgkey: string,
  ): Promise<boolean> {
    const result = await this.prisma.project.count({
      where: {
        id: projectkey,
        orgkey,
        manager: {
          userkey: username
        }
      }
    });

    return result > 0;
  }

  async isOwnedByUser(
    projectkey: string,
    username: string
  ): Promise<boolean> {
    const result = await this.prisma.project.count({
      where: {
        id: projectkey,
        org: {
          ownerkey: username
        }
      }
    });

    return result > 0;
  }

  async belongsToOrganization(
    projectkey: string,
    orgkey: string,
  ): Promise<boolean> {
    const result = await this.prisma.project.count({
      where: {
        id: projectkey,
        orgkey,
      }
    });

    return result > 0;
  }

  async hasMemberUser(
    projectkey: string,
    username: string
  ): Promise<boolean> {
    const result = await this.prisma.project.count({
      where: {
        id: projectkey,
        members: {
          some: {
            user: {
              userkey: username
            }
          }
        }
      }
    });

    return result > 0;
  }
}
