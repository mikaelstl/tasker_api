import { Resources } from "src/common/enums/Resources.enum";
import { AccessContext } from "@interfaces/AccessContext";
import { AffiliationController } from "@modules/affiliations/affiliations.controller";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrgRole } from "generated/prisma";
import { Action } from "generated/prisma/runtime/library";
import { Observable } from "rxjs";
import { ACTION_KEY } from "src/decorators/Action";
import { RESOURCE_KEY } from "src/decorators/Resource";
import { ROLES_KEY } from "@decorators/Role";
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { ORG_KEY } from "@decorators/OrgKey";
import { Request } from 'express';
import { PermissionService } from "@permissions/permission.service";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissions: PermissionService,
  ) {}

  async canActivate(ctx:ExecutionContext): Promise<boolean> {
    const role = this.reflector.getAllAndOverride<OrgRole>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const action = this.reflector.getAllAndOverride<Action>(ACTION_KEY, [ctx.getHandler(), ctx.getClass()])
    const resource = this.reflector.getAllAndOverride<Resources>(RESOURCE_KEY, [ctx.getHandler(), ctx.getClass()])
    const headers = this.getHeaders(ctx.switchToHttp().getRequest())
    
    const orgkey = headers.get(ORG_KEY) as string;

    if (!role && !action) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();

    if (!user || !orgkey) throw new UnauthorizedException('Missing authenticated user. Please login or create a account.')

    // MONTAR CONTEXT
    const payload = {
      action,
      resource,
      subject: {
        userkey: user.username,
        orgkey: orgkey
      }
    } as AccessContext;
    
    // VERIFICAR SE O USUÁRIO PODE EXECUTAR TAREFA
    const hasPermission = this.permissions.can(payload);

    // WHEN USER DON'T HAVE ACCESS TO RESOURCE, THROWS A ForbiddenException
    if (!hasPermission) {
      throw new ForbiddenException("You don't have permission to perform this action.")
    }

    return hasPermission;
  }

  private getHeaders( req: Request ) {
    return new Map(Object.entries(req.headers));
  }
}