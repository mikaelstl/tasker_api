import { ProjectNotExistsException } from "@exceptions/project_not_exists.exception";
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CreateProjectDTO } from "src/DTO/project/project.create.dto";
import { ProjectDTO } from "src/DTO/project/project.dto";
import { ProjectQueryDTO } from "src/DTO/project/project.query.dto";

@Injectable()
export class ProjectRepository {
  constructor (
    // @InjectModel(Project) private readonly Projects: typeof Project
    private readonly prisma: PrismaService
  ) {}
  
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

  async edit(data: any) {};
  
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