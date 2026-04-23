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

/* OWNER: {
    resources: [ Resources.ALL ],
    actions: {}
  },
  MANAGER: {
    resources: [
      Resources.PROJECTS,
      Resources.TASKS,
      Resources.COMMENTS,
      Resources.MEMBERS,
      Resources.EVENTS
    ],
    actions: {}
  },
  MEMBER: {
    resources: [
      Resources.PROJECTS,
      Resources.TASKS,
      Resources.COMMENTS,
      Resources.MEMBERS,
    ],
    actions: {}
  } */

type ResourceMap = Map<Resources, Actions[]>

type RolesPermissions = Map<OrgRole, ResourceMap>

@Injectable()
export class PermissionService {
  private readonly ROLES_PERMISSIONS: RolesPermissions = new Map();

  constructor() {
    // GERAR PERMISSÕES DO OWNER
    this.setOwnerPermissions();

    // GERAR PERMISSÕES DO MANAGER
    this.setManagerPermissions();

    // GERAR PERMISSÕES DO MEMBER
    this.setMemberPermissions();
  }

  can(
    ctx: PolicyContext,
    // policy: () => boolean
  ): boolean {
    // EXTRAIR role, action, resource DE ctx
    const { role, action, resource } = ctx;

    // BUSCAR EM UM MAP PRIVADO DA CLASSE A ROLE
    const perms = this.ROLES_PERMISSIONS.get(role);
    console.log(perms);
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
    console.log(abilities);

    // VERIFICA SE ELE POSSUI ACESSO A ACTION
    const hasAbility = abilities.includes(action) || abilities.includes(Actions.ALL);
    if (!hasAbility) return false;

    // EXECUTA A POLICY
    // const canPerform = policy();

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
    /* MANAGER: {
    resources: [
      Resources.PROJECTS,
      Resources.TASKS,
      Resources.COMMENTS,
      Resources.MEMBERS,
      Resources.EVENTS
    ],
    actions: {}
  }, */

    const ManagerResourceAccess: ResourceMap = new Map();
    
    // const ManagerPermissions = new Set<Actions | '*'>();
    // ManagerPermissions.add('*');

    ManagerResourceAccess.set(
      Resources.PROJECTS,
      [
        Actions.FIND,
        Actions.LIST
      ]
    );
    ManagerResourceAccess.set(
      Resources.TASKS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );
    ManagerResourceAccess.set(
      Resources.COMMENTS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );
    ManagerResourceAccess.set(
      Resources.MEMBERS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );
    ManagerResourceAccess.set(
      Resources.EVENTS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );

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
        Actions.FIND,
        Actions.LIST
      ]
    );
    MemberResourceAccess.set(
      Resources.TASKS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );
    MemberResourceAccess.set(
      Resources.COMMENTS,
      [
        Actions.CREATE,
        Actions.DEL,
        Actions.FIND,
        Actions.LIST,
        Actions.EDIT
      ]
    );
    MemberResourceAccess.set(
      Resources.MEMBERS,
      [
        Actions.FIND,
        Actions.LIST,
      ]
    );
    MemberResourceAccess.set(
      Resources.EVENTS,
      [
        Actions.FIND,
        Actions.LIST,
      ]
    );

    this.ROLES_PERMISSIONS.set(
      OrgRole.MEMBER, MemberResourceAccess
    )
  }
}