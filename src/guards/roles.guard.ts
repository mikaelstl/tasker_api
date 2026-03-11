import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLES_KEY } from "src/decorators/Roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx:ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    
    if (!roles) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const account = req.user;

    const hasPermission = roles.some(role => account.role?.includes(role));
  
    if (!hasPermission) {
      throw new UnauthorizedException('Your account does not have permission to perform this action')
    } else {
      return true;
    }
  }
}