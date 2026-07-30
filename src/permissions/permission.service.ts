import { Injectable, Logger } from '@nestjs/common';
import { BaseActions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";
import { OrgRole } from "generated/prisma";
import { AccessContext } from "@interfaces/AccessContext";
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { AccessValidatorRegistry, ResourcePoliciesKeys } from "src/authorization/access-control/access-control.registry";

type ResourceMap = Map<Resources, BaseActions[]>

type RolesPermissions = Map<OrgRole, ResourceMap>

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  private readonly ROLES_PERMISSIONS: RolesPermissions = new Map();
  
  private readonly registry: AccessValidatorRegistry = AccessValidatorRegistry.instance();

  constructor(
    private readonly affiliations: AffiliationService
  ) {}

  async can(
    ctx: AccessContext,
    // policy: () => boolean
  ): Promise<boolean> {
    // EXTRAIR role, action, resource DE ctx
    const { action, resource, subject, roles } = ctx;

    console.log(subject);

    this.logger.debug(
      `Verificando se o usuário "${subject.userkey}" pode executar a ação "${action}" no recurso "${resource}" da organização "${subject.orgkey}".`
    );

    const affiliation = await this.getRole(subject.userkey, subject.orgkey);
    const userRole = affiliation.role;
    const allowedRoles = roles?.length
      ? roles.join(', ')
      : 'qualquer papel';

    this.logger.debug(
      `O usuário "${subject.userkey}" possui o papel "${userRole}". Papéis aceitos por esta rota: ${allowedRoles}.`
    );

    if (roles?.length && !roles.includes(userRole)) {
      this.logger.warn(
        `Permissão negada para o usuário "${subject.userkey}": o papel "${userRole}" não está entre os papéis aceitos (${allowedRoles}).`
      );
      return false;
    }

    this.logger.debug(
      `O papel "${userRole}" é aceito pela rota. Verificando agora a política específica do recurso.`
    );

    // BUSCAR EM UM MAP PRIVADO, AS PERMISSOES PELA ROLE
    const key: ResourcePoliciesKeys = `${userRole}:${resource}:${action}` as ResourcePoliciesKeys;
    
    const hasPerm = this.registry.has(key);
    if (!hasPerm) {
      this.logger.warn(
        `Permissão negada para o usuário "${subject.userkey}": não existe uma política cadastrada para o papel "${userRole}", recurso "${resource}" e ação "${action}".`
      );
      return false;
    }

    const policy = this.registry.get(key);

    this.logger.debug(
      `Política "${policy.constructor.name}" encontrada. Validando o acesso ao alvo "${subject.targetkey ?? 'não informado'}".`
    );

    const canPerform = await policy.validate(subject, resource);

    if (canPerform) {
      this.logger.log(
        `Permissão concedida ao usuário "${subject.userkey}" para executar a ação "${action}" no recurso "${resource}".`
      );
    } else {
      this.logger.warn(
        `Permissão negada ao usuário "${subject.userkey}" pela política "${policy.constructor.name}".`
      );
    }

    return canPerform;
  }

  public async getRole(userkey: string, orgkey:string) {
    return await this.affiliations.findByUserAndOrgkey(
      userkey,
      orgkey
    );
  }
}
