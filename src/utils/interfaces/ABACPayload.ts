import { OrgRole } from "generated/prisma";
import { Resources } from "@enums/Resources.enum";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { Actions } from "@enums/Actions.enum";

type SubjectResources = 'project' | 'task' | 'org';
type SubjectValues = ProjectDTO | TaskDTO | OrganizationDTO;

type SubjectInfo = {
  userkey: string,
  role: OrgRole
}

type SubjectData = {
  [K in SubjectResources]?: SubjectData;
}

type Subject = SubjectInfo & SubjectData;

interface PolicyContext {
  readonly action: Actions;
  readonly resource: Resources;
  readonly role: OrgRole;
  readonly subject: Subject;   // Aqui deve receber informações do objeto que a ação está relacionada (Project, Task, Organization, ...) junto a role do usuário
  // readonly environment: any;
}

export {
  PolicyContext
}