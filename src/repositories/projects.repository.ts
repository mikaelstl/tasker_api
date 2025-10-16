import { ProjectNotExistsException } from "@exceptions/project_not_exists.exception";
import { ApiResponse } from "@interfaces/response";
import { Checkpoint } from "@models/checkpoint.model";
import { Project } from "@models/project.model";
import { ProjectMember } from "@models/project_member.model";
import { Task } from "@models/task.model";
import { User } from "@models/user.model";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CreateProjectDTO } from "src/DTO/project.create.dto";

@Injectable()
export class ProjectRepository {
  constructor (
    @InjectModel(Project) private readonly Projects: typeof Project
  ) {}
  
  async create(data: CreateProjectDTO) {
    try {
      const result = await this.Projects.create(
        {
          title: data.title,
          description: data.description,
          ownerkey: data.ownerkey,
          due_date: data.due_date
        },
      );

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  };

  async list(user: string) {  
    try {
      const projects = await this.Projects.findAll({
        where: {
          ownerkey: user
        }
      });
      return projects;
    } catch (err) {
      throw new BadRequestException(err);
    }
  };
  
  async find(key: string) {
    try {
      const projects = await this.Projects.findOne({
        where: {
          id: key
        },
        /* include: [
          {
            model: Task,
            as: 'tasks'
          },{
            model: ProjectMember,
            as: 'members'
          },{
            model: Checkpoint,
            as: 'checkpoints'
          },
        ] */
      })

      if (!projects) {
        throw new ProjectNotExistsException();
      }

      return projects;
    } catch (err) {
      throw new BadRequestException(err);
    }
  };

  async edit(data: any) {};
  
  async delete(id: string) {
    try {
      const response = await this.Projects.destroy({
        where: {
          id: id
        }
      });
    
      if (!response) {
        throw new NotFoundException();
      }

      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  };
}