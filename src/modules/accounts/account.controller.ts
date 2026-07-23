import { Body, Controller, Delete, HttpStatus, Patch, Post, Res, UseGuards, } from "@nestjs/common";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { AccountService } from "./account.service";
import { JwtAuthGuard } from "@security/auth.guard";
import { CreateAccountDTO } from "./dto/create.dto";
import { EditAccountDTO } from "./dto/edit-account.dto";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { AccountIdentityDTO } from "./dto/account-identity.dto";

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly service: AccountService,
  ) { }

  @Post('register/')
  async register(
    @Body() data: CreateAccountDTO,
    @Res() res
  ) {
    const result: AccountDTO = await this.service.createAccount(data);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Conta cadastrada com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/accounts/register/'
    };

    return res.status(response.status).json(response);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async editIdentity(
    @CurrentAccount() currentAccount: CurrentAccountDTO,
    @Body() data: EditAccountDTO,
    @Res() res
  ) {
    const result: AccountIdentityDTO = await this.service.editIdentity(
      currentAccount.id,
      data,
    );

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Usuário e conta atualizados com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/accounts/me'
    };

    return res.status(response.status).json(response);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteIdentity(
    @CurrentAccount() currentAccount: CurrentAccountDTO,
    @Res() res
  ) {
    await this.service.deleteIdentity(currentAccount.id);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: null,
      message: 'Usuário e conta excluídos com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/accounts/me'
    };

    return res.status(response.status).json(response);
  }
}
