import {
  EmailAlreadyRegisteredException,
  UsernameAlreadyExistsException,
} from "src/common/errors/already-exists.exceptions";
import { AccountNotFoundException } from "src/common/errors/resource-not-found.exceptions";
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import {
  AccountCredentialsDTO,
  AccountDTO,
} from "@modules/accounts/dto/account.dto";
import { CreateAccountDTO } from "@modules/accounts/dto/create.dto";
import { EditAccountDTO } from "./dto/edit-account.dto";
import { AccountIdentityDTO } from "./dto/account-identity.dto";
import { UserNotFoundException } from "src/common/errors/user-not-found.exception";
import { ConflictException } from "src/common/errors/conflict.exception";

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
      select: {
        id: true,
        email: true,
      },
    });
  }

  async find(key: string): Promise<AccountCredentialsDTO> {
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

  async editIdentity(
    accountId: string,
    data: Omit<EditAccountDTO, 'password'>,
    encryptedPassword?: string,
  ): Promise<AccountIdentityDTO> {
    return this.prisma.$transaction(async (transaction) => {
      const currentAccount = await transaction.account.findUnique({
        where: { id: accountId },
        include: { user: true },
      });

      if (!currentAccount) {
        throw new AccountNotFoundException();
      }

      if (!currentAccount.user) {
        throw new UserNotFoundException();
      }

      if (data.username && data.username !== currentAccount.user.username) {
        const usernameInUse = await transaction.user.findUnique({
          where: { username: data.username },
          select: { username: true },
        });

        if (usernameInUse) {
          throw new UsernameAlreadyExistsException();
        }
      }

      if (data.email && data.email !== currentAccount.email) {
        const emailInUse = await transaction.account.findUnique({
          where: { email: data.email },
          select: { id: true },
        });

        if (emailInUse) {
          throw new EmailAlreadyRegisteredException();
        }
      }

      const account = await transaction.account.update({
        where: { id: accountId },
        data: {
          email: data.email,
          password: encryptedPassword,
        },
        select: {
          id: true,
          email: true,
          created_at: true,
          updated_at: true,
        },
      });

      const user = await transaction.user.update({
        where: { username: currentAccount.user.username },
        data: {
          name: data.name,
          username: data.username,
        },
        select: {
          id: true,
          name: true,
          username: true,
          accountkey: true,
          created_at: true,
          updated_at: true,
        },
      });

      return { account, user };
    });
  }

  async deleteIdentity(accountId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const account = await transaction.account.findUnique({
        where: { id: accountId },
        select: {
          user: {
            select: {
              username: true,
              _count: {
                select: { organizations: true },
              },
            },
          },
        },
      });

      if (!account) {
        throw new AccountNotFoundException();
      }

      if (!account.user) {
        throw new UserNotFoundException();
      }

      if (account.user._count.organizations > 0) {
        throw new ConflictException('Usuário possui organizações');
      }

      await transaction.account.delete({
        where: { id: accountId },
      });
    });
  }
}
