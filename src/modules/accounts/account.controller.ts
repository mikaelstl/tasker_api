import { Body, Controller, Delete, HttpStatus, Param, Post, Res, UseGuards, } from "@nestjs/common";
import { AccountRepository } from "./account.repository";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { AccountService } from "./account.service";
import { JwtAuthGuard } from "@security/auth.guard";
import { CreateAccountDTO } from "./dto/create.dto";

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly repository: AccountRepository,
    private readonly service: AccountService,
  ) { }

  @Post('register/')
  async register(
    @Body() data: CreateAccountDTO,
    @Res() resp
  ) {
    const result: AccountDTO = await this.service.createAccount(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      timestamp: new Date().toISOString(),
      path: '/accounts/register/'
    };

    return resp.status(response.status).json(response);
  }

  @Delete('del/:id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param() id: string,
    @Res() resp
  ) {
    const result: AccountDTO = await this.repository.delete(id);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: null,
      message: 'Account deleted with success',
      timestamp: new Date().toISOString(),
      path: '/accounts/del'
    };

    return resp.status(response.status).json(response);
  }
}