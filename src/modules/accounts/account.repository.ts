import { EmailAlreadyRegisteredException } from "src/common/errors/already-exists.exceptions";
import { AccountNotFoundException } from "src/common/errors/resource-not-found.exceptions";
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { AccountDTO } from "@modules/accounts/dto/account.dto";
import { CreateAccountDTO } from "@modules/accounts/dto/create.dto";

@Injectable()
export class AccountRepository {
  private logger: Logger = new Logger('AccountRepository');

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async accountExists(email: string) {
    const exists = await this.prisma.account.findUnique({
      where: {
        email: email
      }
    });

    if (exists) {
      throw new EmailAlreadyRegisteredException();
    }
  }

  async create(data: CreateAccountDTO): Promise<AccountDTO> {
    await this.accountExists(data.email);
    return this.prisma.account.create({
      data: {
        password: data.password,
        email: data.email,
      },
    });
  }

  async find(key: string): Promise<AccountDTO> {
    const account = await this.prisma.account.findUnique({
      where: {
        email: key
      },
    });

    if (!account) {
      throw new AccountNotFoundException();
    }

    return account;
  }

  async delete(key: string): Promise<AccountDTO> {
    return this.prisma.account.delete({
      where: {
        email: key,
      },
    });
  }
}
