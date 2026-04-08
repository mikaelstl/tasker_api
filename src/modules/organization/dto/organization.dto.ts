import { AffiliationDTO } from "@modules/affiliations/dto/affiliation.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { UserDTO } from "@modules/users/dto/user.dto";

export class OrganizationDTO {
  id:                 string;
  name:               string;
  ownerkey:           string;

  projects?:           ProjectDTO[];
  members?:            AffiliationDTO[];

  created_at:         Date;
  updated_at:         Date;
}