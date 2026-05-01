import { ForbiddenException, Injectable } from "@nestjs/common";
import { Actions } from "@enums/Actions.enum";
import { Resources } from "@enums/Resources.enum";
import { OrgRole } from "generated/prisma";
import { AccessContext } from "@interfaces/AccessContext";
import { AffiliationService } from "@modules/affiliations/affiliations.service";

type ResourceMap = Map<Resources, Actions[]>

type RolesPermissions = Map<OrgRole, ResourceMap>

@Injectable()
export class PermissionService {
  private readonly ROLES_PERMISSIONS: RolesPermissions = new Map();

  constructor(
    private readonly affiliations: AffiliationService
  ) {
    // GERAR PERMISSÕES DO OWNER
    this.setOwnerPermissions();

    // GERAR PERMISSÕES DO MANAGER
    this.setManagerPermissions();

    // GERAR PERMISSÕES DO MEMBER
    this.setMemberPermissions();
  }

  async can(
    ctx: AccessContext,
    // policy: () => boolean
  ): Promise<boolean> {
    // EXTRAIR role, action, resource DE ctx
    const { action, resource, subject } = ctx;

    const role = (await this.getRole(subject.userkey, subject.orgkey)).role;
    console.log(role);

    // BUSCAR EM UM MAP PRIVADO DA CLASSE AS PERMISSOES PELA ROLE
    const perms = this.ROLES_PERMISSIONS.get(role);
    if (!perms) return false;

    // VERIFICAR SE AS PERMISSÕES SÃO GLOBAIS
    const globalPerms = perms.get(Resources.ALL)
    if (globalPerms && globalPerms.includes(Actions.ALL)) {
      return true;
    }
    
    // VERIFICA SE ELE POSSUI ACESSO AO RESOURCE
    const hasAccess = perms.has(resource);
    if (!hasAccess) return false;

    const abilities = perms.get(resource);

    // VERIFICA SE ELE POSSUI ACESSO A ACTION
    const hasAbility = abilities.includes(action) || abilities.includes(Actions.ALL);
    if (!hasAbility) return false;

    // VERIFICA O NIVEL DE PERMISSÃO DONO, GERENCIA OU PARTICIPA

    // PEGA A POLICY DE ACORDO COM A ROLE E A ACTION

    // RETORNA SE O USUÁRIO ESTÁ AUTORIZADO OU NÃO
    return true;
  }

  private setOwnerPermissions() {
    const OwnerResourceAccess: ResourceMap = new Map();
    
    OwnerResourceAccess.set(Resources.ALL, [ Actions.ALL ])

    this.ROLES_PERMISSIONS.set(
      OrgRole.OWNER, OwnerResourceAccess
    )
  }

  private setManagerPermissions() {
    const ManagerResourceAccess: ResourceMap = new Map([
      [ Resources.PROJECTS, [ Actions.SEEK ] ],
      [ Resources.TASKS,    [ Actions.CREATE,Actions.DEL,Actions.SEEK, Actions.EDIT] ],
      [ Resources.COMMENTS, [ Actions.CREATE,Actions.DEL,Actions.SEEK,Actions.EDIT] ],
      [ Resources.MEMBERS,  [ Actions.CREATE,Actions.DEL,Actions.SEEK,Actions.EDIT] ],
      [ Resources.EVENTS,   [ Actions.CREATE,Actions.DEL,Actions.SEEK,Actions.EDIT] ]
    ]);

    this.ROLES_PERMISSIONS.set(
      OrgRole.MANAGER, ManagerResourceAccess
    )
  }

  private setMemberPermissions() {

    const MemberResourceAccess: ResourceMap = new Map();
    
    // const MemberPermissions = new Set<Actions | '*'>();
    // MemberPermissions.add('*');

    MemberResourceAccess.set(
      Resources.PROJECTS,
      [
        Actions.SEEK,
      ]
    );
    MemberResourceAccess.set(
      Resources.TASKS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.SEEK,
        Actions.EDIT
      ]
    );
    MemberResourceAccess.set(
      Resources.COMMENTS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.SEEK,
        Actions.EDIT
      ]
    );
    MemberResourceAccess.set(
      Resources.MEMBERS,
      [
        Actions.SEEK,
      ]
    );
    MemberResourceAccess.set(
      Resources.EVENTS,
      [
        Actions.SEEK,
      ]
    );

    this.ROLES_PERMISSIONS.set(
      OrgRole.MEMBER, MemberResourceAccess
    )
  }

  public async getRole(userkey: string, orgkey:string) {
    return await this.affiliations.findByUserOrgKey(
      userkey,
      orgkey
    );
  }
}