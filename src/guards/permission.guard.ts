import { Resources } from "@enums/Resources.enum";
import { PolicyContext } from "@interfaces/ABACPayload";
import { AffiliationController } from "@modules/affiliations/affiliations.controller";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionService } from "@permissions/permission.service";
import { OrgRole } from "generated/prisma";
import { Action } from "generated/prisma/runtime/library";
import { Observable } from "rxjs";
import { ACTION_KEY } from "src/decorators/Action";
import { RESOURCE_KEY } from "src/decorators/Resource";
import { ROLES_KEY } from "@decorators/Role";
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { ORG_KEY } from "@decorators/OrgKey";
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissions: PermissionService,
    private readonly affiliations: AffiliationService
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

    console.log(user);

    if (!user || !orgkey) throw new UnauthorizedException('Missing authenticated user. Please login or create a account.')

    const affiliation = await this.affiliations.findByUserOrgKey(
      user.username,
      orgkey
    );

    console.log(affiliation);
    

    // MONTAR CONTEXT
    const payload = {
      action,
      resource,
      role: affiliation.role,
    } as PolicyContext;

    console.log(payload);
    
    
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