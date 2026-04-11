import { ApiResponse } from "@interfaces/ApiResponse";
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { AuthService } from "src/security/auth.service";
import { AuthDTO } from "src/security/dto/auth.dto";
import { LoginDTO } from "src/security/dto/login.dto";
import { CreateUserDTO } from "@modules/users/dto/create.dto";
import { AccountDTO } from "@modules/accounts/dto/account.dto";

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

  // @Post('register')
  // async register(
  //   @Body() data: CreateUserDTO,
  //   @Res() resp
  // ) {
  //   const result: AccountDTO = await this.service.register(data);

  //   const response: ApiResponse = {
  //     status: HttpStatus.CREATED,
  //     data: result,
  //     message: 'Registered with success',
  //     error: false,
  //     timestamp: new Date().toISOString(),
  //     path: '/auth/register'
  //   };

  //   return resp.status(response.status).json(response);
  // }

  @Get('validate')
  async validate(
    @Res() resp,
    @Headers('Authorization') auth: string
  ) {
    const token = auth.split(' ')[1];

    const result: boolean = await this.service.validate(token);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Valid token',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/auth/validate'
    };

    return resp.status(response.status).json(response);
  }
}