import { Resources } from "@enums/Resources.enum";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionService } from "@permissions/permission.service";
import { OrgRole } from "generated/prisma";
import { Action } from "generated/prisma/runtime/library";
import { Observable } from "rxjs";
import { ACTION_KEY } from "src/decorators/Action";
import { RESOURCE_KEY } from "src/decorators/Resource";
import { ROLES_KEY } from "src/decorators/Roles";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissions: PermissionService
  ) {}

  canActivate(ctx:ExecutionContext): boolean {
    const role = this.reflector.getAllAndOverride<OrgRole>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const action = this.reflector.getAllAndOverride<Action>(ACTION_KEY, [ctx.getHandler(), ctx.getClass()])
    const resource = this.reflector.getAllAndOverride<Resources>(RESOURCE_KEY, [ctx.getHandler(), ctx.getClass()])

    if (!role && !action) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException('Missing authenticated user. Please login or create a account.')

    // PEGAR POLICY NO MAP DE POLICIES
    
    // MONTAR CONTEXT
    
    // VERIFICAR SE O USUÁRIO PODE EXECUTAR TAREFA

    // WHEN USER DON'T HAVE ACCESS TO RESOURCE, THROWS A ForbiddenException
  }
}