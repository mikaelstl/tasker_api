import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SECRET } from 'src/config/env.config';
import { AuthDTO } from 'src/DTO/auth/auth.dto';
import { UserDTO } from 'src/DTO/user/user.dto';
import { UserRepository } from 'src/repositories/user.repository';
import { WrongPasswordException } from 'src/utils/errors/wrong_password.exception';
import { compare, compareSync, hash } from 'bcrypt'
import { CreateUserDTO } from 'src/DTO/user/create.dto';
import { LoginDTO } from 'src/DTO/auth/login.dto';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor (
    private readonly userRepository: UserRepository,
    private readonly jwt:            JwtService,
  ){}

  async validate(token: string): Promise<boolean | null> {
    try {
      const decoded = this.jwt.verify<JwtPayload>(token, {
        secret: SECRET,
      });

      const exists = await this.userRepository.find(decoded.username);

      if (!exists) {
        throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
      }

      return true;
    } catch (err: any) {
      throw new UnauthorizedException("You don't have authorization to perform this action. Please log-in or create a account");
    }
  }

  async login(data: LoginDTO): Promise<AuthDTO> {
    const user = await this.userRepository.find(data.username);
    
    const match: boolean = await compare(data.password, user.password);
    
    if (user && !match) {
      throw new WrongPasswordException();
    }

    const payload = { sub: user.id!, username: user.username };

    const token = await this.jwt.signAsync(payload, { secret: SECRET })

    return {
      user: user.id,
      username: user.username,
      access_token: token
    } as AuthDTO;
  }

  async register(data: CreateUserDTO) {
    const hashed = await hash(data.password, 8);

    const user: CreateUserDTO = {
      username: data.username,
      name: data.name,
      email: data.email,
      password: hashed
    }

    return this.userRepository.create(user);
  }
}
