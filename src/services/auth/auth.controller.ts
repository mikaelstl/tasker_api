import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { AuthService } from "@services/auth.service";
import { AuthDTO } from "src/DTO/auth/auth.dto";
import { LoginDTO } from "src/DTO/auth/login.dto";
import { CreateUserDTO } from "src/DTO/user/create.dto";
import { UserDTO } from "src/DTO/user/user.dto";

@Controller('auth')
export class AuthController {
  constructor (
    private readonly service: AuthService
  ) {}

  @Get()
  async status(
    @Res() response
  ) {
    return response.status(HttpStatus.OK).json('AUTH ONLINE');
  }

  @Post('login')
  async login(
    @Body() data: LoginDTO,
    @Res() resp
  ) {
    const result: AuthDTO = await this.service.login(data);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Logged',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/auth/login'
    };

    return resp.status(response.status).json(response);
  }

  @Post('register')
  async register(
    @Body() data: CreateUserDTO,
    @Res() resp
  ) {
    const result: UserDTO = await this.service.register(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/auth/register'
    };

    return resp.status(response.status).json(response);
  }
}