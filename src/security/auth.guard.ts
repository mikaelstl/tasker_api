import { JWTPayload } from "src/common/interfaces/JWTPayload";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import {
  ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { SECRET } from "src/config/env.config";
import { BusinessException } from 'src/common/errors/business.exception';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor (
    private readonly jwtService: JwtService,
    private readonly reflector:  Reflector
  ) {
    super();
  }
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new BusinessException('Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.', HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload: JWTPayload = await this.jwtService.verifyAsync(
        token,
        { secret: SECRET }
      )

      request.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email
      } as CurrentAccountDTO;
    } catch (error) {
      throw new BusinessException('Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }

  private extractTokenFromHeader( req: Request ) {
    const [ type, token ] = req.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      throw new BusinessException('Você não tem autorização para realizar esta ação. Entre na sua conta ou crie uma nova.', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
