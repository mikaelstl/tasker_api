import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SECRET } from 'src/config/env.config';
import { AuthDTO } from 'src/DTO/auth/auth.dto';
import { WrongPasswordException } from 'src/utils/errors/wrong_password.exception';
import { compare, compareSync, hash } from 'bcrypt'
import { LoginDTO } from 'src/DTO/auth/login.dto';
import { JwtPayload } from 'jsonwebtoken';
import { AccountRepository } from '@modules/accounts/account.repository';
import { AccountRole } from 'generated/prisma';

type JWTPayload = {
  sub: string,
  email: string,
  role: AccountRole
};

@Injectable()
export class AuthService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly jwt: JwtService,
  ) { }

  async validate(token: string): Promise<boolean | null> {
    try {
      const decoded = this.jwt.verify<JwtPayload>(token, {
        secret: SECRET,
      });

      const exists = await this.accountRepository.find(decoded.email);

      if (!exists) {
        throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
      }

      return true;
    } catch (err: any) {
      throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
    }
  }

  async login(data: LoginDTO): Promise<AuthDTO> {
    const account = await this.accountRepository.find(data.email);

    const match: boolean = await compare(data.password, account.password);

    if (account && !match) {
      throw new WrongPasswordException();
    }

    const payload: JWTPayload = { sub: account.id!, email: account.email, role: account.role };

    const token = await this.jwt.signAsync(payload, { secret: SECRET })

    return {
      account: account.id,
      email: account.email,
      access_token: token
    } as AuthDTO;
  }

  // async register(data: CreateAccountDTO) {
  //   const hashed = await hash(data.password, 8);

  //   const account: CreateAccountDTO = {
  //     email: data.email,
  //     password: hashed
  //   }

  //   return this.accountRepository.create(account);
  // }
}
