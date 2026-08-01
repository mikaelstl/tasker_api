import { Injectable, Optional } from '@nestjs/common';
import { ProjectRepository } from "@modules/projects/projects.repository";
import { AuditAction, AuditResource, OrgRole } from "generated/prisma";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { AccessDeniedException } from "src/common/errors/access-denied.exception";
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { EditProjectDTO } from './dto/edit.dto';
import { AffiliationNotFoundException } from 'src/common/errors/resource-not-found.exceptions';

type ListMethodCommand = {
  [K in OrgRole]: () => Promise<ProjectDTO[]>
}

@Injectable()
export class ProjectService implements AccessValidator {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly affiliations: AffiliationService,
    @Optional() private readonly audit?: AuditLogService,
  ) { }

  async create(data: CreateProjectDTO, actorkey: string) {
    const project = await this.repository.create(data);
    await this.audit?.logUserMutation({
      orgkey: project.orgkey,
      actorkey,
      action: AuditAction.CREATE,
      resource: AuditResource.PROJECTS,
      resourcekey: project.id,
      after: project as unknown as Record<string, unknown>,
      fields: ['title', 'description', 'deadline', 'stage', 'priority', 'managerkey'],
    });
    return project;
  }

  async edit(key: string, update: EditProjectDTO, context: AuditContext) {
    const before = await this.repository.find(key, { orgkey: context.orgkey });

    if (update.managerkey !== undefined && update.managerkey !== null) {
      const manager = await this.affiliations.findByIdAndOrganization(
        update.managerkey,
        before.orgkey,
      );

      if (!manager || manager.role !== OrgRole.MANAGER) {
        throw new AffiliationNotFoundException();
      }
    }

    const project = await this.repository.edit(
      key,
      context.orgkey,
      update,
    );
    const action = before.stage !== project.stage
      ? AuditAction.STATUS_CHANGE
      : AuditAction.UPDATE;
    await this.audit?.logUserMutation({
      ...context,
      action,
      resource: AuditResource.PROJECTS,
      resourcekey: project.id,
      before: before as unknown as Record<string, unknown>,
      after: project as unknown as Record<string, unknown>,
      fields: ['title', 'description', 'deadline', 'stage', 'priority', 'managerkey', 'delayed'],
    });
    return project;
  }

  async delete(key: string, context: AuditContext) {
    const project = await this.repository.delete(key, context.orgkey);
    await this.audit?.logUserMutation({
      ...context,
      action: AuditAction.DELETE,
      resource: AuditResource.PROJECTS,
      resourcekey: project.id,
      before: project as unknown as Record<string, unknown>,
      fields: ['title', 'description', 'deadline', 'stage', 'priority', 'managerkey'],
    });
    return project;
  }

  async list(
    data: CurrentAccountDTO,
    orgkey: string,
    queries: ProjectQueryDTO = {},
  ): Promise<ProjectDTO[]> {
    const affiliation = await this.affiliations.findByUserAndOrgkey(
      data.username,
      orgkey,
    );

    console.log(affiliation);

    const methods: ListMethodCommand = {
      OWNER: () => this.repository.listByOrganizer(orgkey, queries),
      MANAGER: () => this.repository.listByManager(
        affiliation.id,
        orgkey,
        queries,
      ),
      MEMBER: () => this.repository.listByMember(
        affiliation.id,
        orgkey,
        queries,
      ),
    };

    return methods[affiliation.role]();
  }

  async find(
    key: string,
    data: CurrentAccountDTO,
    orgkey: string,
  ): Promise<ProjectDTO> {
    const affiliation = await this.affiliations.findByUserAndOrgkey(
      data.username,
      orgkey,
    );

    const project = await this.repository.find(key, { orgkey });
    
    const isMember = project.members?.some(
      (member) => member.userkey === affiliation.id,
    ) ?? false;
    
    const canView = affiliation.role === OrgRole.OWNER
      || (affiliation.role === OrgRole.MANAGER
        && (project.managerkey === affiliation.id || isMember))
      || (affiliation.role === OrgRole.MEMBER && isMember);

    if (!canView) {
      throw new AccessDeniedException();
    }

    return project;
  }

  public async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      return await this.repository.isOwnedByUser(targetkey, subjectkey);
    } catch (err) {
      throw new InternalException('Falha ao verificar a propriedade do projeto.', err);
    }
  }

  public async manage(
    subjectkey: string,
    targetkey: string,
    orgkey: string,
  ): Promise<boolean> {
    try {
      return await this.repository.isManagedByUser(
        targetkey,
        subjectkey,
        orgkey,
      );
    } catch (err) {
      throw new InternalException('Falha ao verificar o gerenciamento do projeto.', err);
    }
  }

  public async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      return await this.repository.hasMemberUser(targetkey, subjectkey);
    } catch (err: any) {
      throw new InternalException('Falha ao verificar a participação no projeto.', err);
    }
  }

  public async belongsToOrganization(
    projectkey: string,
    orgkey: string,
  ): Promise<boolean> {
    try {
      return await this.repository.belongsToOrganization(projectkey, orgkey);
    } catch (err: any) {
      throw new InternalException('Falha ao verificar a organização do projeto.', err);
    }
  }
}
