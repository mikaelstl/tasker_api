import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { UserDTO } from "@modules/users/dto/user.dto";
import { OrgRole } from "generated/prisma";

export interface AffiliationDTO {
  readonly id:      string,
  readonly orgkey:  string,
  readonly userkey: string,
  readonly org?: OrganizationDTO,
  readonly user?: UserDTO,
  role:    OrgRole,
}
