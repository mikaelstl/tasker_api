import { Body, Controller, Get, HttpStatus, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { CreateUserDTO } from "@modules/users/dto/create.dto";
import { UserDTO } from "@modules/users/dto/user.dto";
import { UserRepository } from "@modules/users/user.repository";
import { JwtAuthGuard } from "src/security/auth.guard";
import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { UserQueryDTO } from "./dto/user-query.dto";
import { CurrentAccount } from "@decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "./dto/current-account.dto";
import { UserProfileDTO } from "./dto/user-profile.dto";

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

    return res.status(response.status).json(response);
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

    return res.status(response.status).json(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async profile(
    @CurrentAccount() currentAccount: CurrentAccountDTO,
    @Res() res
  ) {
    const result: UserProfileDTO =
      await this.repository.findProfileByAccountId(currentAccount.id);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Informações do usuário obtidas com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/users/me'
    };

    return res.status(response.status).json(response);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  async find(
    @Param('username') username: string,
    @Query()  queries: UserQueryDTO,
    @Res() res
  ) {
    const result: UserDTO = await this.repository.find({ username, accountkey: queries.accountkey });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Usuário encontrado com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/users'
    };

    return res.status(response.status).json(response);
  }

}
