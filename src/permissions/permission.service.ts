import { ForbiddenException, Injectable } from "@nestjs/common";
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

    const userRole = (await this.getRole(subject.userkey, subject.orgkey)).role;

    if (roles?.length && !roles.includes(userRole)) {
      return false;
    }

    // BUSCAR EM UM MAP PRIVADO, AS PERMISSOES PELA ROLE
    const key: ResourcePoliciesKeys = `${userRole}:${resource}:${action}` as ResourcePoliciesKeys;
    
    const hasPerm = this.registry.has(key);
    if (!hasPerm) return false;

    const policy = this.registry.get(key);

    const canPerform = policy.validate(subject);
    
    return canPerform;
  }

  public async getRole(userkey: string, orgkey:string) {
    return await this.affiliations.findByUserAndOrgkey(
      userkey,
      orgkey
    );
  }
}
