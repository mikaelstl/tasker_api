import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, UseInterceptors } from "@nestjs/common";
import { UserRepository } from "@modules/users/user.repository";
import { UserNotExistsException } from "src/common/errors/user_not_exists.exception";
import { AccountRepository } from "./account.repository";
import { CreateAccountDTO } from "@modules/accounts/dto/create.dto";
import { RegisterAccount } from "./register-account";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import { compare, compareSync, hash } from 'bcrypt'

@Injectable()
export class AccountService {
  private logger: Logger = new Logger('AcountService');

  constructor(
    private readonly repository: AccountRepository
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

  async createAccount(data: RegisterAccount): Promise<AccountDTO> {
    const encryptedPass = await this.dataWithEncryptedPass(data);

    return this.repository.create(encryptedPass);
  }

  async promoteAccountToManager() {
    // TO_DO
    // Função restrita ao Organizer onde deve mudar o tipo de conta (role) para OrgRole.MANAGER
  }
}