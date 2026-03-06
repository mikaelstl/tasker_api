import { Body, Controller, HttpStatus, Post, Res, } from "@nestjs/common";
import { CreateUserDTO } from "src/DTO/user/create.dto";
import { AccountRepository } from "./account.repository";
import { AccountDTO } from "src/DTO/account/account.dto";
import { ApiResponse } from "@interfaces/response";
import { AccountService } from "./account.service";
import { RegisterAccount } from "./register-account";

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly repository: AccountRepository,
    private readonly service: AccountService,
  ) { }

  @Post('register/org')
  async org(
    @Body() data: RegisterAccount,
    @Res() resp
  ) {
    const result: AccountDTO = await this.service.createOrgAccount(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/accounts/register/org'
    };

    return resp.status(response.status).json(response);
  }

  @Post('register/common')
  async common(
    @Body() data: RegisterAccount,
    @Res() resp
  ) {
    const result: AccountDTO = await this.service.createCommonAccount(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/accounts/register/common'
    };

    return resp.status(response.status).json(response);
  }
}