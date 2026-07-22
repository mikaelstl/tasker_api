import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateUserDTO } from "@modules/users/dto/create.dto";
import { UserDTO } from "@modules/users/dto/user.dto";
import { UserRepository } from "@modules/users/user.repository";
import { AuthService } from "src/security/auth.service";
import { JwtAuthGuard } from "src/security/auth.guard";
import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { UserQueryDTO } from "./dto/user-query.dto";

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  @Post()
  async create(
    @Body() data: CreateUserDTO,
    @Res() res
  ) {
    const result: UserDTO = await this.repository.create(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Usuário cadastrado com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return res.status(res.status).json(response);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Res() res
  ) {
    const result: UserDTO[] = await this.repository.list();

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Usuários listados com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return res.status(res.status).json(response);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async find(
    @Query()  queries: UserQueryDTO,
    @Res() res
    
  ) {
    const result: UserDTO = await this.repository.find(queries);
    
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Usuário encontrado com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return res.status(res.status).json(response);
  }

  @Delete('del/:username')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('username') username: string,
    @Res() res
  ) {
    const result: UserDTO = await this.repository.delete(username);
    
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Usuário excluído com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/users/del'
    };

    return res.status(res.status).json(response);
  }
}
