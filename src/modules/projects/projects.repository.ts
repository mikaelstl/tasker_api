import { ProjectNotExistsException } from "@exceptions/project_not_exists.exception";
import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { $Enums } from "generated/prisma";
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
    try {
      const result = await this.prisma.project.create({
        data: {
          title: data.title,
          description: data.description,
          ownerkey: data.ownerkey,
          due_date: data.due_date
        },
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async list(queries: ProjectQueryDTO) {
    try {
      const projects = await this.prisma.project.findMany({
        where: queries,
      });
      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async listByMember(key: string): Promise<ProjectDTO[]> {
    try {
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
          due_date: true
        }
      });

      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async listByOrganizer(key: string): Promise<ProjectDTO[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          owner: {
            ownerkey: {
              equals: key
            }
          },
        },
      });

      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async listByManager(key: string): Promise<ProjectDTO[]> {
    try {
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
          due_date: true
        }
      });

      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async find(key: string) {
    try {
      const projects = await this.prisma.project.findUnique({
        where: {
          id: key
        },
        include: {
          members: true
        }
      })

      if (!projects) {
        throw new ProjectNotExistsException();
      }

      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };

  async edit(key: string, update: EditProjectDTO): Promise<ProjectDTO> {
    await this.projectExists(key);
    try {
      const result = await this.prisma.project.update({
        where: {
          id: key
        },
        data: update,
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const response = await this.prisma.project.delete({
        where: {
          id: id
        }
      });

      if (!response) {
        throw new NotFoundException();
      }

      return response;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  };
}