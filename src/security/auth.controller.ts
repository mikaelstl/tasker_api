import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
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
    @Res() res
  ) {
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: null,
      message: 'Autenticação disponível.',
      timestamp: new Date().toISOString(),
      path: '/auth'
    };

    return res.status(response.status).json(response);
  }

  @Post('login')
  async login(
    @Body() data: LoginDTO,
    @Res() res
  ) {
    const result: AuthDTO = await this.service.login(data);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Autenticação realizada com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/auth/login'
    };

    return res.status(response.status).json(response);
  }

  // @Post('register')
  // async register(
  //   @Body() data: CreateUserDTO,
  //   @Res() res
  // ) {
  //   const result: AccountDTO = await this.service.register(data);

  //   const response: ApiResponse = {
  //     status: HttpStatus.CREATED,
  //     data: result,
  //     message: 'Cadastro realizado com sucesso.',
  //     
  //     timestamp: new Date().toISOString(),
  //     path: '/auth/register'
  //   };

  //   return res.status(response.status).json(response);
  // }

  @Get('validate')
  async validate(
    @Res() res,
    @Headers('Authorization') auth: string
  ) {
    // const token = auth.split(' ')[1];

    const result: boolean = await this.service.validate(auth);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Token válido.',
      
      timestamp: new Date().toISOString(),
      path: '/auth/validate'
    };

    return res.status(response.status).json(response);
  }
}
