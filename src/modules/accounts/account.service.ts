import { Injectable, Logger } from '@nestjs/common';
import { AccountRepository } from "./account.repository";
import { CreateAccountDTO } from "@modules/accounts/dto/create.dto";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import {  hash } from 'bcrypt'
import { EditAccountDTO } from "./dto/edit-account.dto";
import { AccountIdentityDTO } from "./dto/account-identity.dto";

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

  async editIdentity(
    accountId: string,
    data: EditAccountDTO,
  ): Promise<AccountIdentityDTO> {
    const encryptedPassword = data.password
      ? await hash(data.password, 8)
      : undefined;

    const changes: Omit<EditAccountDTO, 'password'> = { ...data };
    delete (changes as EditAccountDTO).password;

    return this.repository.editIdentity(
      accountId,
      changes,
      encryptedPassword,
    );
  }

  async deleteIdentity(accountId: string): Promise<void> {
    await this.repository.deleteIdentity(accountId);
  }
}
