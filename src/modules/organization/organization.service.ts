import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { UserRepository } from "@modules/users/user.repository";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationCreateDTO } from "./dto/create.dto";
import { AffiliationRepository } from "@modules/affiliations/affiliations.repository";
import { OrgRole } from "generated/prisma";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { Resources } from "src/common/enums/Resources.enum";

@Injectable()
export class OrganizationService implements AccessValidator {
  private readonly logger: Logger = new Logger('AcountService');

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

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists({
        id: targetkey,
        ownerkey: subjectkey
      });

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to verify organization ownership.", err)
      return false;
    }
  }

  public async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.find(targetkey);
    
      const value = result.members.find(m => m.userkey === subjectkey);

      return !!value;
    } catch (err) {
      this.logger.warn("[ERROR] to verify organization membership.", err)
      return false;
    }
  }
}