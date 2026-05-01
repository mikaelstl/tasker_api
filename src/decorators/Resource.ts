import { Resources } from "src/common/enums/Resources.enum";
import { SetMetadata } from "@nestjs/common";

export const RESOURCE_KEY = 'resource_key';
export const Resource = (resource: Resources) => SetMetadata(RESOURCE_KEY, resource);