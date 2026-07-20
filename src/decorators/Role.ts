import { SetMetadata } from "@nestjs/common";
import { OrgRole } from "generated/prisma";

export const ROLES_KEY = 'org_roles';
export const Role = (...roles: OrgRole[]) => SetMetadata(ROLES_KEY, roles);
