import { OrgRole } from "generated/prisma";

export interface UserOrganizationSummaryDTO {
  orgkey: string;
  role: OrgRole;
  name: string;
  projects: number;
  members: number;
};