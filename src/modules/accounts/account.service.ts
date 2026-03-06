import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, UseInterceptors } from "@nestjs/common";
import { UserRepository } from "@modules/users/user.repository";
import { UserNotExistsException } from "src/utils/errors/user_not_exists.exception";
import { AccountRepository } from "./account.repository";
import { CreateAccountDTO } from "src/DTO/account/create.dto";
import { RegisterAccount } from "./register-account";
import { AccountDTO } from "src/DTO/account/account.dto";
import { AccountRole } from "generated/prisma";
import { compare, compareSync, hash } from 'bcrypt'

@Injectable()
export class AccountService {
  private logger: Logger = new Logger('AcountService');

  constructor(
    private readonly accountsRepository: AccountRepository
  ) { }

  async dataWithEncryptedPass(data: RegisterAccount): Promise<RegisterAccount> {
    try {
      const hashed = await hash(data.password, 8);

      return {
        email: data.email,
        password: hashed
      };
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createOrgAccount(data: RegisterAccount): Promise<AccountDTO> {
    const encryptedPass = await this.dataWithEncryptedPass(data);

    const account: AccountDTO = {
      ...encryptedPass,
      role: AccountRole.ORGANIZER
    }

    return this.accountsRepository.create(account);
  }

  async createCommonAccount(data: RegisterAccount): Promise<AccountDTO> {
    const encryptedPass = await this.dataWithEncryptedPass(data);

    const account: AccountDTO = {
      ...encryptedPass,
      role: AccountRole.COMMON
    }

    return this.accountsRepository.create(account);
  }

  async promoteAccountToManager() {
    // TO_DO
    // Função restrita ao Organizer onde deve mudar o tipo de conta (role) para AccountRole.MANAGER
  }
}