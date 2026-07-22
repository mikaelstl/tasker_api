import { Injectable } from '@nestjs/common';
import { ProjectRepository } from "@modules/projects/projects.repository";
import { OrgRole } from "generated/prisma";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { AccessDeniedException } from "src/common/errors/access-denied.exception";

type ListMethodCommand = {
  [K in OrgRole]: () => Promise<ProjectDTO[]>
}

@Injectable()
export class ProjectService implements AccessValidator {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly affiliations: AffiliationService,
  ) { }

  async create(data: CreateProjectDTO) {
    return this.repository.create(data);
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

  public async manage(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      return await this.repository.isManagedByUser(targetkey, subjectkey);
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
