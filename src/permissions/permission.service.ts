import { ABACPayload } from "@interfaces/ABACPayload";
import { Permission } from "./type/permissions.type";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { UserRepository } from "@modules/users/user.repository";
import { ROLE_PERMISSIONS } from "./permissions.map";

@Injectable()
export class PermissionService {
  constructor(
    private readonly users: UserRepository
  ){}

  can(payload: ABACPayload) {
    const { action, subject } = payload;

    if (false) {
      throw new ForbiddenException("You don't have permission to perform this action.");
    }

    
  }
}