import { Resources } from "src/common/enums/Resources.enum";
import { AccessContext } from "@interfaces/AccessContext";
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/errors/unauthorized.exception';
import { AccessDeniedException } from 'src/common/errors/access-denied.exception';
import { Reflector } from "@nestjs/core";
import { OrgRole } from "generated/prisma";
import { ACTION_KEY } from "src/decorators/Action";
import { RESOURCE_KEY } from "src/decorators/Resource";
import { ROLES_KEY } from "@decorators/Role";
import { ORG_KEY } from "@decorators/OrgKey";
import { Request } from 'express';
import { PermissionService } from "@permissions/permission.service";
import { BaseActions, EnhancedActions } from "@enums/Actions.enum";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissions: PermissionService,
  ) {}

  async canActivate(ctx:ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const action = this.reflector.getAllAndOverride<BaseActions | EnhancedActions>(ACTION_KEY, [ctx.getHandler(), ctx.getClass()])
    const resource = this.reflector.getAllAndOverride<Resources>(RESOURCE_KEY, [ctx.getHandler(), ctx.getClass()])
    const req = ctx.switchToHttp().getRequest();
    const headers = this.getHeaders(req);

    const orgkey = headers.get(ORG_KEY) as string;

    if (!roles && !action) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException();

    if (!orgkey) throw new UnauthorizedException();

    const id = req.body?.id
      ?? req.body?.project
      ?? req.body?.projectkey
      ?? req.params?.id
      ?? req.params?.projectkey
      ?? req.params?.code;

    // MONTAR CONTEXT
    const payload = {
      action,
      resource,
      roles,
      subject: {
        userkey: user.username,
        orgkey: orgkey,
        targetkey: id,
        projectkey: req.params?.projectkey,
        taskcode: req.params?.code,
      }
    } as AccessContext;

    // VERIFICAR SE O USUÁRIO PODE EXECUTAR TAREFA
    const hasPermission = await this.permissions.can(payload);

    // A falta de acesso e uma regra de negocio publica (HTTP 403).
    if (!hasPermission) {
      throw new AccessDeniedException();
    }

    return hasPermission;
  }

  private getHeaders( req: Request ) {
    return new Map(Object.entries(req.headers));
  }
}
