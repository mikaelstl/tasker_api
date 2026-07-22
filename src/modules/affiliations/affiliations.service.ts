import { Injectable } from '@nestjs/common';
import { InternalException } from 'src/common/errors/internal.exception';
import {
  AffiliationNotFoundException,
  UserOrganizationAffiliationNotFoundException,
} from 'src/common/errors/resource-not-found.exceptions';
import { AuditAction, AuditResource, OrgRole } from "generated/prisma";
import { AffiliationRepository } from "./affiliations.repository";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { APIMessage } from "@interfaces/ApiMessage";
import { AccessValidator } from "@interfaces/AccessValidator";
import { UserOrganizationSummaryDTO } from "./dto/summary.dto";
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';

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
    private readonly audit: AuditLogService,
  ) { }

  async create(data: DefineAffiliationDTO, actorkey?: string) {
    const affiliation = await this.repository.create(data);
    if (actorkey) {
      await this.audit.logUserMutation({
        orgkey: affiliation.orgkey,
        actorkey,
        action: AuditAction.ADD,
        resource: AuditResource.AFFILIATIONS,
        resourcekey: affiliation.id,
        after: affiliation as unknown as Record<string, unknown>,
        fields: ['userkey', 'role'],
      });
    }
    return affiliation;
  }

  async delete(key: string, context: AuditContext) {
    const affiliation = await this.repository.delete(key);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.REMOVE,
      resource: AuditResource.AFFILIATIONS,
      resourcekey: affiliation.id,
      before: affiliation as unknown as Record<string, unknown>,
      fields: ['userkey', 'role'],
    });
    return affiliation;
  }

  async promote(key: string, context: AuditContext): Promise<AffiliationDTO | APIMessage> {
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

    const previousRole = value.role;
    const data = RolePromotes[value.role](value);

    const affiliation = await this.repository.update(key, data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.UPDATE,
      resource: AuditResource.AFFILIATIONS,
      resourcekey: affiliation.id,
      before: { role: previousRole },
      after: affiliation as unknown as Record<string, unknown>,
      fields: ['role'],
    });
    return affiliation;
  }

  async demote(key: string, context: AuditContext): Promise<AffiliationDTO | APIMessage> {
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

    const previousRole = value.role;
    const data = RolePromotes[value.role](value);

    const affiliation = await this.repository.update(key, data);
    await this.audit.logUserMutation({
      ...context,
      action: AuditAction.UPDATE,
      resource: AuditResource.AFFILIATIONS,
      resourcekey: affiliation.id,
      before: { role: previousRole },
      after: affiliation as unknown as Record<string, unknown>,
      fields: ['role'],
    });
    return affiliation;
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
