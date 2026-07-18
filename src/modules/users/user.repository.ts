import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { UserDTO } from "@modules/users/dto/user.dto";
import { AlreadyExistsException } from "src/common/errors/user_exists.error";
import { UserNotExistsException } from "src/common/errors/user_not_exists.exception";
import { CreateUserDTO } from "@modules/users/dto/create.dto";
import { PrismaService } from "src/database/prisma.service";
import { UserQueryDTO } from "./dto/user-query.dto";

@Injectable()
export class UserRepository {
  private logger: Logger = new Logger('UserRepository');

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async userExists(username: string) {
    const exists = await this.prisma.user.findUnique({
      where: {
        username: username
      }
    });

    if (exists) {
      throw new AlreadyExistsException('Já existe um usuário com este nome de usuário.')
    }
  }

  async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.userExists(data.username);
    try {
      const result = await this.prisma.user.create({
        data: {
          name: data.name,
          username: data.username,
          accountkey: data.accountkey
        }
      });
  
      return result;
    } catch (err: any) {
      throw new HttpException('Não foi possível criar o usuário.', HttpStatus.BAD_REQUEST);
    }
  }

  async list(): Promise<UserDTO[]> {
    try {
      const response = await this.prisma.user.findMany();

      return response;
    } catch (err: any) {
      throw new HttpException('Não foi possível listar os usuários.', HttpStatus.BAD_REQUEST);
    }
  }

  async find(queries: UserQueryDTO): Promise<UserDTO> {
    console.log(queries);
    
    const user = await this.prisma.user.findUnique({
      where: queries,
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
      throw new HttpException('Não foi possível atualizar o usuário.', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('Não foi possível excluir o usuário.', HttpStatus.BAD_REQUEST);
    }
  }
}
