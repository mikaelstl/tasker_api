import { ProjectDTO } from "../project/project.dto";
import { UserDTO } from "../user/user.dto";

export class OrganizationDTO {
  id:                 string;
  name:               string;
  enterprise:         boolean;
  ownerkey:           string;

  projects?:           ProjectDTO[];
  members?:            UserDTO[];

  created_at:         Date;
  updated_at:         Date;
}