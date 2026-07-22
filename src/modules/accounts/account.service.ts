import { Injectable, Logger } from '@nestjs/common';
import { AccountRepository } from "./account.repository";
import { CreateAccountDTO } from "@modules/accounts/dto/create.dto";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import {  hash } from 'bcrypt'

@Injectable()
export class AccountService {
  private logger: Logger = new Logger('AcountService');

  constructor(
    private readonly repository: AccountRepository
  ) { }

  async dataWithEncryptedPass(data: CreateAccountDTO): Promise<CreateAccountDTO> {
    const hashed = await hash(data.password, 8);

    return {
      email: data.email,
      password: hashed,
    };
  }

  async createAccount(data: CreateAccountDTO): Promise<AccountDTO> {
    const encryptedPass = await this.dataWithEncryptedPass(data);

    return this.repository.create(encryptedPass);
  }
}
