import { SetMetadata } from "@nestjs/common";

export const RESOURCE_KEY = 'resource_roles';
export const Roles = (resource: string) => SetMetadata(RESOURCE_KEY, resource);