import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SECRET } from '@config/env.config';
import { AuthDTO } from '@security/dto/auth.dto';
import { WrongPasswordException } from 'src/common/errors/wrong_password.exception';
import { compare, compareSync, hash } from 'bcrypt'
import { LoginDTO } from '@security/dto/login.dto';
import { JwtPayload } from 'jsonwebtoken';
import { AccountRepository } from '@modules/accounts/account.repository';
import { JWTPayload } from 'src/common/interfaces/JWTPayload';
import { UserRepository } from '@modules/users/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) { }

  async validate(token: string): Promise<boolean | null> {
    try {
      const decoded = this.jwt.verify<JwtPayload>(token, {
        secret: SECRET,
      });

      const exists = await this.accounts.find(decoded.email);

      if (!exists) {
        throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
      }

      return true;
    } catch (err: any) {
      throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
    }
  }

  async login(data: LoginDTO): Promise<AuthDTO> {
    const account = await this.accounts.find(data.email);
    const user = await this.users.find({
      accountkey: account.id
    })

    console.log(account);

    console.log(user);
    
    const match: boolean = await compare(data.password, account.password);

    if (!account || !user) {
      throw new NotFoundException('No User or Account found with this infos.')
    }

    if (account && !match) {
      throw new WrongPasswordException();
    }

    const payload: JWTPayload = { sub: account.id!, username: user.username, email: account.email };

    const token = await this.jwt.signAsync(payload, { secret: SECRET })

    return {
      account: account.id,
      email: account.email,
      access_token: token
    } as AuthDTO;
  }
}
