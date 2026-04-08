import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { UserRepository } from "@modules/users/user.repository";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationCreateDTO } from "./dto/create.dto";
import { AffiliationRepository } from "@modules/affiliations/affiliations.repository";
import { OrgRole } from "generated/prisma";

@Injectable()
export class OrganizationService {
  private logger: Logger = new Logger('AcountService');

  constructor(
    private readonly repository: OrganizationRepository,
    private readonly projects: ProjectRepository,
    private readonly affiliations: AffiliationRepository,
    private readonly users: UserRepository
  ) { }

  async create(data: OrganizationCreateDTO): Promise<OrganizationDTO> {
    return await this.repository.create(data).then(
      async (org) => {
        await this.affiliations.create({
          orgkey: org.id,
          userkey: org.ownerkey,
          role: OrgRole.OWNER
        });
        return org;
      }
    )
  }

  async delete(key: string) {
    return this.repository.delete(key).then(
      async (org) => {
        org.projects.forEach(
          (p) => this.projects.delete(p.id)
        );

        org.members.forEach(
          (aff) => this.users.edit(aff.userkey, { orgkey: null })
        )
      }
    );
  }
}