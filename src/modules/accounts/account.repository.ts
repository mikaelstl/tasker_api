import { AlreadyExistsException } from "src/common/errors/user_exists.error";
import { UserNotExistsException } from "src/common/errors/user_not_exists.exception";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
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
      throw new AlreadyExistsException('Este e-mail já está cadastrado.')
    }
  }

  async create(data: CreateAccountDTO): Promise<AccountDTO> {
    await this.accountExists(data.email);
    try {
      const result = await this.prisma.account.create({
        data: {
          password: data.password,
          email: data.email,
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException('Não foi possível criar a conta.', HttpStatus.BAD_REQUEST);
    }
  }

  async find(key: string): Promise<AccountDTO> {
    const account = await this.prisma.account.findUnique({
      where: {
        email: key
      },
    });

    if (!account) {
      throw new UserNotExistsException();
    }

    return account;
  }

  async delete(key: string): Promise<AccountDTO> {
    try {
      const result = await this.prisma.account.delete({
        where: {
          email: key
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException('Não foi possível excluir a conta.', HttpStatus.BAD_REQUEST);
    }
  }
}
