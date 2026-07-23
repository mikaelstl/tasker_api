import { OrgRole } from "generated/prisma";
import { Resources } from "src/common/enums/Resources.enum";
import { BaseActions, EnhancedActions } from "src/common/enums/Actions.enum";

type AccessSubject = {
  userkey: string,
  orgkey: string,
  targetkey: string,
  projectkey?: string,
  taskcode?: string,
  taskkey?: string,
  commentkey?: string,
  eventkey?: string,
}

interface AccessContext {
  readonly action: BaseActions | EnhancedActions;
  readonly resource: Resources;
  readonly roles: OrgRole[];
  readonly subject: AccessSubject;   // Aqui deve receber informações do objeto que a ação está relacionada (Project, Task, Organization) junto a role do usuário
  // readonly environment: any;
}

export {
  AccessContext,
  AccessSubject
}
