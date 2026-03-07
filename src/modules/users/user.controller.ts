import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateUserDTO } from "src/DTO/user/create.dto";
import { UserDTO } from "src/DTO/user/user.dto";
import { UserRepository } from "@modules/users/user.repository";
import { AuthService } from "src/security/auth.service";
import { JwtAuthGuard } from "src/security/auth.guard";
import { ApiResponse } from "@interfaces/response";

@Controller('users')
@UseGuards(JwtAuthGuard)
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
      error: false,
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return resp.status(response.status).json(response);
  }

  @Get()
  async list() {
    return await this.repository.list();
  }

  @Get(':username')
  async find(
    @Param('username') username: string
  ) {
    console.log(username);
    
    return await this.repository.find(username);
  }
}