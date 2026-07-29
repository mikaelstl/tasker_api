import { Resources } from "src/common/enums/Resources.enum";
import { AccessContext } from "@interfaces/AccessContext";
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(PermissionGuard.name);

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
    const route = `${req.method} ${req.originalUrl ?? req.url}`;

    const orgkey = headers.get(ORG_KEY) as string;
    const allowedRoles = roles?.length
      ? roles.join(', ')
      : 'nenhum papel informado';

    this.logger.debug(
      `Analisando o acesso à rota "${route}". Recurso: "${resource ?? 'não informado'}"; ação: "${action ?? 'não informada'}"; papéis aceitos: ${allowedRoles}.`
    );

    if (!roles && !action) {
      this.logger.debug(
        `A rota "${route}" não possui restrição de papel nem de ação. O acesso será liberado sem consultar as políticas.`
      );
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn(
        `Acesso negado à rota "${route}": não foi encontrado um usuário autenticado na requisição.`
      );
      throw new UnauthorizedException();
    }

    this.logger.debug(
      `O usuário "${user.username}" está autenticado e está tentando acessar a rota "${route}".`
    );

    if (!orgkey) {
      this.logger.warn(
        `Acesso negado ao usuário "${user.username}": a organização não foi informada no cabeçalho da requisição.`
      );
      throw new UnauthorizedException();
    }

    this.logger.debug(
      `A verificação será realizada na organização "${orgkey}" para o usuário "${user.username}".`
    );

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

    this.logger.debug(
      `Consultando as permissões do usuário "${user.username}" para executar a ação "${action}" no recurso "${resource}". Alvo: "${id ?? 'não informado'}"; papéis aceitos: ${allowedRoles}.`
    );

    // VERIFICAR SE O USUÁRIO PODE EXECUTAR TAREFA
    let hasPermission: boolean;

    try {
      hasPermission = await this.permissions.can(payload);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'erro desconhecido';

      this.logger.error(
        `Não foi possível concluir a verificação de permissão do usuário "${user.username}" na organização "${orgkey}". Motivo: ${reason}.`
      );
      throw error;
    }

    // A falta de acesso e uma regra de negocio publica (HTTP 403).
    if (!hasPermission) {
      this.logger.warn(
        `Acesso negado ao usuário "${user.username}": ele não possui permissão para executar a ação "${action}" no recurso "${resource}" da organização "${orgkey}".`
      );
      throw new AccessDeniedException();
    }

    this.logger.log(
      `Acesso autorizado: o usuário "${user.username}" pode executar a ação "${action}" no recurso "${resource}" da organização "${orgkey}".`
    );

    return hasPermission;
  }

  private getHeaders( req: Request ) {
    return new Map(Object.entries(req.headers));
  }
}
