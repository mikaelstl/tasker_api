import { AffiliationDTO } from "@modules/affiliations/dto/affiliation.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { UserDTO } from "@modules/users/dto/user.dto";

export interface OrganizationDTO {
  readonly id:                 string;
  readonly name:               string;
  readonly ownerkey:           string;

  readonly owner?:             UserDTO;
  readonly projects?:          ProjectDTO[];
  readonly members?:           AffiliationDTO[];

  readonly created_at:         Date;
  readonly updated_at:         Date;
}