import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from "./organization.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { UserRepository } from "@modules/users/user.repository";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationCreateDTO } from "./dto/create.dto";
import { AffiliationRepository } from "@modules/affiliations/affiliations.repository";
import { OrgRole } from "generated/prisma";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { Resources } from "src/common/enums/Resources.enum";
import { InternalException } from 'src/common/errors/internal.exception';

@Injectable()
export class OrganizationService implements AccessValidator {
  constructor(
    private readonly repository: OrganizationRepository,
    // private readonly projects: ProjectRepository,
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
    return this.repository.delete(key);
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists({
        id: targetkey,
        ownerkey: subjectkey
      });

      return result;
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade da organização.', err);
    }
  }

  public async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.find(targetkey);
    
      const value = result.members.find(m => m.userkey === subjectkey);

      return !!value;
    } catch (err) {
      throw new InternalException('Falha ao verificar a participação na organização.', err);
    }
  }
}
