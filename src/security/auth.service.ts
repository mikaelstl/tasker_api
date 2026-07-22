import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SECRET } from '@config/env.config';
import { AuthDTO } from '@security/dto/auth.dto';
import { compare } from 'bcrypt';
import { LoginDTO } from '@security/dto/login.dto';
import { JwtPayload } from 'jsonwebtoken';
import { AccountRepository } from '@modules/accounts/account.repository';
import { JWTPayload } from 'src/common/interfaces/JWTPayload';
import { UserRepository } from '@modules/users/user.repository';
import { BusinessException } from 'src/common/errors/business.exception';
import { InternalException } from 'src/common/errors/internal.exception';
import { UnauthorizedException } from 'src/common/errors/unauthorized.exception';
import { WrongPasswordException } from 'src/common/errors/wrong_password.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) { }

  async validate(header: string): Promise<boolean | null> {
    const token = this.extractTokenFromHeader(header);

    if (!token) throw new UnauthorizedException();

    let decoded: JwtPayload;

    try {
      decoded = this.jwt.verify<JwtPayload>(token, {
        secret: SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    try {
      await this.accounts.find(decoded.email);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw new UnauthorizedException();
      }

      throw new InternalException('Falha ao validar a conta autenticada.', error);
    }

    return true;
  }

  async login(data: LoginDTO): Promise<AuthDTO> {
    const account = await this.accounts.find(data.email);
    const user = await this.users.find({
      accountkey: account.id
    })

    const match: boolean = await compare(data.password, account.password);

    if (!match) {
      throw new WrongPasswordException();
    }

    const payload: JWTPayload = { sub: account.id!, username: user.username, email: account.email };

    const token = await this.jwt.signAsync(payload, { secret: SECRET })

    const acc: AuthDTO = {
      account: account.id,
      email: account.email,
      username: user.username,
      access_token: token
    };


    return acc;
  }

  private extractTokenFromHeader(header: String) {
    if (!header) return undefined;

    const [type, token] = header?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
