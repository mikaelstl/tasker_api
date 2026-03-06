import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx:ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());

    if (!roles) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const account = req.user;

    return roles.some(role => account.role?.includes(role));
  }
}