import { Resources } from "src/common/enums/Resources.enum";
import { AccessContext } from "@interfaces/AccessContext";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
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
    const role = this.reflector.getAllAndOverride<OrgRole>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const action = this.reflector.getAllAndOverride<BaseActions | EnhancedActions>(ACTION_KEY, [ctx.getHandler(), ctx.getClass()])
    const resource = this.reflector.getAllAndOverride<Resources>(RESOURCE_KEY, [ctx.getHandler(), ctx.getClass()])
    const req = ctx.switchToHttp().getRequest();
    const headers = this.getHeaders(req);

    const orgkey = headers.get(ORG_KEY) as string;

    if (!role && !action) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException('Usuário autenticado não encontrado. Entre na sua conta ou crie uma nova.');

    if (!orgkey) throw new UnauthorizedException('Organização válida não encontrada. Selecione uma organização válida ou crie uma nova.');

    const id = req.body?.id
      ?? req.params?.id
      ?? req.params?.projectkey
      ?? req.params?.code;

    // MONTAR CONTEXT
    const payload = {
      action,
      resource,
      role,
      subject: {
        userkey: user.username,
        orgkey: orgkey,
        targetkey: id
      }
    } as AccessContext;

    // VERIFICAR SE O USUÁRIO PODE EXECUTAR TAREFA
    const hasPermission = await this.permissions.can(payload);

    // WHEN USER DON'T HAVE ACCESS TO RESOURCE, THROWS A ForbiddenException
    if (!hasPermission) {
      throw new ForbiddenException("Você não tem permissão para realizar esta ação.")
    }

    return hasPermission;
  }

  private getHeaders( req: Request ) {
    return new Map(Object.entries(req.headers));
  }
}
