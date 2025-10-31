import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { UserDTO } from "src/DTO/user/user.dto";
import { AlreadyExistsException } from "@exceptions/user_exists.error";
import { UserNotExistsException } from "@exceptions/user_not_exists.exception";
import { CreateUserDTO } from "src/DTO/user/create.dto";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class UserRepository {
  private logger: Logger = new Logger('UserRepository');

  constructor(
    // @InjectModel(User) private readonly Users: typeof User
    private readonly prisma: PrismaService
  ) {}

  async userExists(username: string) {
    const exists = await this.prisma.user.findUnique({
      where: {
        username: username
      }
    });

    if (exists) {
      throw new AlreadyExistsException('User with this username already exists.')
    }
  }

  async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.userExists(data.username);
    try {
      const result = await this.prisma.user.create({
        data: {
          name: data.name,
          username: data.username,
          password: data.password,
          email: data.email
        }
      });
  
      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async list(): Promise<UserDTO[]> {
    try {
      const response = await this.prisma.user.findMany();

      return response;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async find(key: string): Promise<UserDTO> {
    const user = await this.prisma.user.findUnique({
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
  }

  async edit(username: string, update: any): Promise<UserDTO> {
    try {
      const result = await this.prisma.user.update({
        data: update,
        where: {
          username: username
        }
      });
      
      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(key: string): Promise<UserDTO> {
    try {
      const result = await this.prisma.user.delete({
        where: {
          username: key
        }
      });
      
      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}