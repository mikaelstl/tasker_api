import { SetMetadata } from "@nestjs/common";
import { OrgRole } from "generated/prisma";

export const ROLES_KEY = 'org_roles';
export const Role = (role: OrgRole) => SetMetadata(ROLES_KEY, role);