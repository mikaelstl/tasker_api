import { ForbiddenException, Injectable } from "@nestjs/common";
import { Actions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";
import { OrgRole } from "generated/prisma";
import { PolicyContext } from "@interfaces/ABACPayload";

// type RolesPermissions = {
//   [ K in OrgRole | '*' ]: {
//     [ R in Resources ]?: Actions[] | '*'
//   }
// }

type ResourceMap = Map<Resources | '*', Set<Actions | '*'>>

type RolesPermissions = Map<OrgRole, ResourceMap>

@Injectable()
export class PermissionService {
  private readonly ROLES_PERMISSIONS: RolesPermissions;

  constructor() {
    // GERAR PERMISSÕES DO OWNER

    // GERAR PERMISSÕES DO MANAGER
    
    // GERAR PERMISSÕES DO MEMBER
  }

  can(
    ctx: PolicyContext,
    // policy: () => boolean
  ): boolean {
    // EXTRAIR role, action, resource DE ctx
    const { role, action, resource } = ctx;

    // BUSCAR EM UM MAP PRIVADO DA CLASSE A ROLE
    const perms = this.ROLES_PERMISSIONS.get(role);
    if (!perms) return false;

    // VERIFICA SE ELE POSSUI ACESSO AO RESOURCE
    const hasAccess = perms.has(resource);
    if (!hasAccess) return false;

    const abilities = perms.get(resource);

    // VERIFICA SE ELE POSSUI ACESSO A ACTION
    const hasAbility = abilities.has(action)
    if (!hasAbility) return false;

    // EXECUTA A POLICY
    // const canPerform = policy();

    // RETORNA SE O USUÁRIO ESTÁ AUTORIZADO OU NÃO
    return true;
  }
}