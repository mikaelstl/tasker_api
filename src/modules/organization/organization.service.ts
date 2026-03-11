import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { UserRepository } from "@modules/users/user.repository";
import { OrganizationDTO } from "src/DTO/organization/organization.dto";

@Injectable()
export class OrganizationService {
  private logger: Logger = new Logger('AcountService');

  constructor(
    private readonly repository: OrganizationRepository,
    private readonly projects: ProjectRepository,
    private readonly users: UserRepository
  ) { }

  async delete(key: string) {
    return this.repository.delete(key).then(
      async (org) => {
        org.projects.forEach(
          (p) => this.projects.delete(p.id)
        );

        org.members.forEach(
          (u) => this.users.edit(u.username, { orgkey: null })
        )
      }
    );
  }
}