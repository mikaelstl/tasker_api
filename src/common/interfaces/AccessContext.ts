import { OrgRole } from "generated/prisma";
import { Resources } from "src/common/enums/Resources.enum";
import { Actions } from "src/common/enums/Actions.enum";

type AccessSubject = {
  userkey: string,
  projectkey?: string,
  taskkey?: string,
  orgkey?: string,
  commentkey?: string,
  eventkey?: string,
}

interface AccessContext {
  readonly action: Actions;
  readonly resource: Resources;
  readonly role: OrgRole;
  readonly subject: AccessSubject;   // Aqui deve receber informações do objeto que a ação está relacionada (Project, Task, Organization) junto a role do usuário
  // readonly environment: any;
}

export {
  AccessContext,
  AccessSubject
}