import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateUserDTO } from "@modules/users/dto/create.dto";
import { UserDTO } from "@modules/users/dto/user.dto";
import { UserRepository } from "@modules/users/user.repository";
import { AuthService } from "src/security/auth.service";
import { JwtAuthGuard } from "src/security/auth.guard";
import { ApiResponse } from "@interfaces/ApiResponse";

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  @Post()
  async create(
    @Body() data: CreateUserDTO,
    @Res() resp
  ) {
    const result: UserDTO = await this.repository.create(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return resp.status(response.status).json(response);
  }

  @Get()
  async list(
    @Res() resp
  ) {
    const result: UserDTO[] = await this.repository.list();

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return resp.status(response.status).json(response);
  }

  @Get(':username')
  async find(
    @Param('username') username: string,
    @Res() resp
  ) {
    const result: UserDTO = await this.repository.find(username);
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return resp.status(response.status).json(response);
  }

  @Delete('del/:username')
  async delete(
    @Param('username') username: string,
    @Res() resp
  ) {
    const result: UserDTO = await this.repository.delete(username);
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      
      timestamp: new Date().toISOString(),
      path: '/users/del'
    };

    return resp.status(response.status).json(response);
  }
}