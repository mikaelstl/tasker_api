import { OrgRole } from "generated/prisma";

export interface UserOrganizationSummaryDTO {
  affiliationId: string;
  orgkey: string;
  role: OrgRole;
  name: string;
  projects: number;
  members: number;
};