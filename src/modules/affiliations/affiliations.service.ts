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
import { AccessValidator } from "@interfaces/AccessValidator";
import { UserOrganizationSummaryDTO } from "./dto/summary.dto";
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { BusinessRuleException } from 'src/common/errors/business-rule.exception';
import { AccessDeniedException } from 'src/common/errors/access-denied.exception';
import { AffiliationQuery } from './dto/query.dto';

// type ListMethodCommand = {
//   [key: string]: (key: string) => Promise<ProjectDTO[]>
// }

@Injectable()
export class AffiliationService implements AccessValidator {
  constructor(
    private readonly repository: AffiliationRepository,
    private readonly audit: AuditLogService,
  ) { }

  async create(data: DefineAffiliationDTO, actorkey?: string) {
    if ((data.role as OrgRole) === OrgRole.OWNER) {
      throw new BusinessRuleException(
        'O papel OWNER só pode ser atribuído por transferência de propriedade.',
      );
    }

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
    const current = await this.repository.findByIdAndOrganization(
      key,
      context.orgkey,
    );

    if (!current) {
      throw new AffiliationNotFoundException();
    }

    if (current.role === OrgRole.OWNER) {
      throw new BusinessRuleException(
        'A afiliação OWNER não pode ser removida antes da transferência de propriedade.',
      );
    }

    const affiliation = await this.repository.delete(key, context.orgkey);
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

  async promote(key: string, context: AuditContext): Promise<AffiliationDTO> {
    const value = await this.repository.findByIdAndOrganization(
      key,
      context.orgkey,
    );

    if (!value) {
      throw new AffiliationNotFoundException();
    }

    if (value.role !== OrgRole.MEMBER) {
      throw new BusinessRuleException(
        'A promoção comum permite apenas a transição de MEMBER para MANAGER.',
      );
    }

    const previousRole = value.role;
    const affiliation = await this.repository.update(
      key,
      context.orgkey,
      { role: OrgRole.MANAGER },
    );
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

  async demote(key: string, context: AuditContext): Promise<AffiliationDTO> {
    const value = await this.repository.findByIdAndOrganization(
      key,
      context.orgkey,
    );

    if (!value) {
      throw new AffiliationNotFoundException();
    }

    if (value.role !== OrgRole.MANAGER) {
      throw new BusinessRuleException(
        'O rebaixamento comum permite apenas a transição de MANAGER para MEMBER.',
      );
    }

    const previousRole = value.role;
    const affiliation = await this.repository.update(
      key,
      context.orgkey,
      { role: OrgRole.MEMBER },
    );
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

    console.log("--- AFILIAÇÃO ---");
    console.log(result);

    if (!result) {
      throw new UserOrganizationAffiliationNotFoundException();
    }

    return result;
  }

  async findWithQueries(queries: AffiliationQuery): Promise<AffiliationDTO> {
    const result = await this.repository.findWithQueries(queries);

    console.log("--- AFILIAÇÃO ---");
    console.log(result);

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

  async getOrganizationAffiliations(
    orgkey: string,
    userkey: string,
  ): Promise<AffiliationDTO[]> {
    await this.findByUserAndOrgkey(userkey, orgkey);
    return this.repository.findByOrganization(orgkey);
  }

  async transferOwnership(
    targetAffiliationId: string,
    context: AuditContext,
  ): Promise<AffiliationDTO> {
    const requester = await this.findByUserAndOrgkey(
      context.actorkey,
      context.orgkey,
    );

    if (requester.role !== OrgRole.OWNER) {
      throw new AccessDeniedException();
    }

    const previousOwner = requester;
    const newOwner = await this.repository.transferOwnership(
      context.orgkey,
      targetAffiliationId,
      context.actorkey,
    );

    if (previousOwner.id !== newOwner.id) {
      await this.audit.logUserMutation({
        ...context,
        action: AuditAction.UPDATE,
        resource: AuditResource.AFFILIATIONS,
        resourcekey: newOwner.id,
        before: { ownerkey: previousOwner.userkey },
        after: {
          ownerkey: newOwner.userkey,
          role: newOwner.role,
        },
        fields: ['ownerkey', 'role'],
      });
    }

    return newOwner;
  }

  async findByIdAndOrganization(
    id: string,
    orgkey: string,
  ): Promise<AffiliationDTO | null> {
    return this.repository.findByIdAndOrganization(id, orgkey);
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
