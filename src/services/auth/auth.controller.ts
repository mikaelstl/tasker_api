import { Body, Controller, Get, HttpStatus, Post, Res, UseInterceptors } from "@nestjs/common";
import { AuthService } from "@services/auth.service";
import { LoginDTO } from "src/DTO/auth/login.dto";
import { CreateUserDTO } from "src/DTO/user/create.dto";

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

  @Post('/login')
  async login(
    @Body() data: LoginDTO,
  ) {
    return await this.service.login(data);
  }

  @Post('register')
  async register(
    @Body() data: CreateUserDTO,
  ) {
    return await this.service.register(data)
  }
}