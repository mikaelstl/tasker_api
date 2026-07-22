import { Injectable } from '@nestjs/common';
import { InternalException } from 'src/common/errors/internal.exception';
import {
  AffiliationNotFoundException,
  UserOrganizationAffiliationNotFoundException,
} from 'src/common/errors/resource-not-found.exceptions';
import { OrgRole } from "generated/prisma";
import { AffiliationRepository } from "./affiliations.repository";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { APIMessage } from "@interfaces/ApiMessage";
import { AccessValidator } from "@interfaces/AccessValidator";
import { UserOrganizationSummaryDTO } from "./dto/summary.dto";

// type ListMethodCommand = {
//   [key: string]: (key: string) => Promise<ProjectDTO[]>
// }

type AffiliationRoleTrasistion = {
  [ key in OrgRole ]: (affiliation: AffiliationDTO) => AffiliationDTO
}

@Injectable()
export class AffiliationService implements AccessValidator {
  constructor(
    private readonly repository: AffiliationRepository,
  ) { }

  async create(data: DefineAffiliationDTO) {
    return this.repository.create(data);
  }

  async delete(key: string) {
    return this.repository.delete(key);
  }

  async promote(key: string): Promise<AffiliationDTO | APIMessage> {
    const RolePromotes: AffiliationRoleTrasistion = {
      'MEMBER': (affiliation: AffiliationDTO) => {
                    affiliation.role = OrgRole.MANAGER
                    return affiliation;
                  },
      'MANAGER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.OWNER
                    return affiliation;
                  },
      'OWNER': (affiliation: AffiliationDTO) => { return null }
    }

    const value = await this.repository.findById(key);

    if (!value) {
      throw new AffiliationNotFoundException();
    }

    if (value.role === OrgRole.OWNER) {
      return {
        message: `O usuário já possui a função máxima: OWNER. Não é possível promovê-lo.`,
        timestamp: new Date().toISOString()
      } as APIMessage;
    }

    const data = RolePromotes[value.role](value);

    return this.repository.update(key, data);
  }

  async demote(key: string): Promise<AffiliationDTO | APIMessage> {
    const RolePromotes: AffiliationRoleTrasistion = {
      'MEMBER': (affiliation: AffiliationDTO) => { return null },
      'MANAGER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.MEMBER
                    return affiliation;
                  },
      'OWNER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.MANAGER
                    return affiliation;
                  }
    }

    const value = await this.repository.findById(key);

    if (!value) {
      throw new AffiliationNotFoundException();
    }

    if (value.role === OrgRole.OWNER) {
      return {
        message: `O usuário possui a função OWNER. Não é possível rebaixá-lo por esta operação.`,
        timestamp: new Date().toISOString()
      } as APIMessage;
    }

    const data = RolePromotes[value.role](value);

    return this.repository.update(key, data);
  }

  async findByUserAndOrgkey(
    userkey: string,
    orgkey: string
  ): Promise<AffiliationDTO> {
    const result = await this.repository.findByUserAndOrgkey(
      userkey,
      orgkey
    );

    if (!result) {
      throw new UserOrganizationAffiliationNotFoundException();
    }

    return result;
  }

  async getUserOrganizations(
    userkey: string
  ): Promise<UserOrganizationSummaryDTO[]> {
    return this.repository.findOrganizationsByUser(userkey);
  }

  async getOrganizationsByUser(
    userkey: string,
  ) {
    const result = await this.repository.findOrganizationsByUser(userkey);

    return result ?? [];
  }

  async participates(userkey: string, orgkey: string): Promise<boolean> {
    try {
      const affiliation = await this.repository.findByUserAndOrgkey(
        userkey,
        orgkey
      );

      return !!affiliation;
    } catch (err: any) {
      throw new InternalException('Falha ao verificar a participação do usuário na organização.', err);
    }
  }

  async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    return false;
  }
}
