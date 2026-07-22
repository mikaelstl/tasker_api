import { Injectable, Logger } from '@nestjs/common';
import { UserDTO } from "@modules/users/dto/user.dto";
import { UsernameAlreadyExistsException } from "src/common/errors/already-exists.exceptions";
import { UserNotFoundException } from "src/common/errors/user-not-found.exception";
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
      throw new UsernameAlreadyExistsException();
    }
  }

  async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.userExists(data.username);
    return this.prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        accountkey: data.accountkey,
      },
    });
  }

  async list(): Promise<UserDTO[]> {
    return this.prisma.user.findMany();
  }

  async find(queries: UserQueryDTO): Promise<UserDTO> {
    console.log(queries);
    
    const user = await this.prisma.user.findUnique({
      where: queries,
    });
    
    if (!user) {
      throw new UserNotFoundException();
    }
    
    return user;
  }

  async edit(username: string, update: any): Promise<UserDTO> {
    return this.prisma.user.update({
      data: update,
      where: {
        username,
      },
    });
  }

  async delete(key: string): Promise<UserDTO> {
    return this.prisma.user.delete({
      where: {
        username: key,
      },
    });
  }
}
