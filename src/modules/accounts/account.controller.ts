import { Body, Controller, HttpStatus, Param, Post, Res, } from "@nestjs/common";
import { AccountRepository } from "./account.repository";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import { ApiResponse } from "@interfaces/ApiResponse";
import { AccountService } from "./account.service";
import { RegisterAccount } from "./register-account";

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly repository: AccountRepository,
    private readonly service: AccountService,
  ) { }

  @Post('register/')
  async common(
    @Body() data: RegisterAccount,
    @Res() resp
  ) {
    const result: AccountDTO = await this.service.createAccount(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/accounts/register/'
    };

    return resp.status(response.status).json(response);
  }

  @Post('del/:id')
  async delete(
    @Param() id: string,
    @Res() resp
  ) {
    const result: AccountDTO = await this.repository.delete(id);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/accounts/del'
    };

    return resp.status(response.status).json(response);
  }
}