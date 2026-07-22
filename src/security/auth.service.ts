import { HttpStatus, Injectable } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) { }

  async validate(header: string): Promise<boolean | null> {
    const token = this.extractTokenFromHeader(header);

    let decoded: JwtPayload;

    try {
      decoded = this.jwt.verify<JwtPayload>(token, {
        secret: SECRET,
      });
    } catch (error) {
      throw new BusinessException('Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.', HttpStatus.UNAUTHORIZED);
    }

    try {
      await this.accounts.find(decoded.email);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw new BusinessException('Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.', HttpStatus.UNAUTHORIZED);
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

    if (!account || !user) {
      throw new BusinessException('Nenhum usuário ou conta foi encontrado com os dados informados.', HttpStatus.NOT_FOUND);
    }

    if (account && !match) {
      throw new BusinessException('Senha incorreta. Informe a senha correta ou altere sua senha.', HttpStatus.UNAUTHORIZED);
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
