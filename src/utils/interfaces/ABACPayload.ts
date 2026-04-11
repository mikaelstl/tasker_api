import { OrgRole } from "generated/prisma";
import { Resources } from "@enums/Resources.enum";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { TaskDTO } from "@modules/tasks/dto/task.dto";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";

type SubjectResources = 'project' | 'task' | 'org';
type SubjectData = ProjectDTO | TaskDTO | OrganizationDTO;

type ABACSubjectInfo = {
  userkey: string,
  role: OrgRole
}

type ABACSubjectData = {
  [K in SubjectResources]?: SubjectData;
}

type ABACSubject = ABACSubjectInfo & ABACSubjectData;

interface ABACPayload {
  readonly action: string;
  readonly subject: ABACSubject;   // Aqui deve receber informações do objeto que a ação está relacionada (Project, Task, Organization, ...) junto a role do usuário
  readonly resource: Resources;
  // readonly environment: any;
}

export {
  ABACSubject,
  ABACPayload
}