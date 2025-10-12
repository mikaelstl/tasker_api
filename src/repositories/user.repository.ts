import { BadRequestException, Injectable } from "@nestjs/common";
import { UserDTO } from "src/DTO/user/user.dto";
import { AlreadyExistsException } from "@exceptions/user_exists.error";
import { UserNotExistsException } from "@exceptions/user_not_exists.exception";
import { User } from "@models/user.model";
import { InjectModel } from "@nestjs/sequelize";
import { Invite } from "@models/invite.model";
import { Project } from "@models/project.model";
import { Task } from "@models/task.model";
import { CreateUserDTO } from "src/DTO/user/create.dto";

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User) private readonly Users: typeof User
  ) {}

  async userExists(username: string) {
    const exists = await this.Users.findByPk(username);
    console.log('run this?');
    

    if (exists) {
      throw new AlreadyExistsException('USER WITH THIS USERNAME ALREADY EXISTS')
    }
  }

  async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.userExists(data.username);
    try {
      const result = await this.Users.create(
        {
          name: data.name,
          username: data.username,
          password: data.password,
          email: data.email
        }
      )
  
      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list() {
    try {
      const response = await this.Users.findAll();

      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async find(key: string): Promise<UserDTO> {
    try {
      const user = await this.Users.findOne({
        where: {
          username: key
        },
        /* include: [
          {
            model: Invite,
            as: 'invites'
          },
          {
            model: Project,
            as: 'projects'
          },
          {
            model: Task,
            as: 'tasks'
          },
          {
            model: User,
            as: 'relations',
            through: {
              attributes: []
            }
          }
        ] */
      });

      if (!user) {
        throw new UserNotExistsException();
      }

      return user;
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async edit(username: string, update: any): Promise<any> {
    try {
      const result = await this.Users.update(
        update,
        {
          where: {
            username: username
          },
          returning: true
        },
      );
      
      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(key: string): Promise<any> {
    return 'to-do';
  }
}