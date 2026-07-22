import { Injectable } from '@nestjs/common';
import { MembersRepository } from "@modules/members/member.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { $Enums, OrgRole } from "generated/prisma";
import { DefineMemberDTO } from "@modules/members/dto/member.create.dto";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { AccessValidator } from "src/common/interfaces/AccessValidator";
import { InternalException } from 'src/common/errors/internal.exception';

type ListMethodCommand = {
  [K in OrgRole]: (key: string) => Promise<ProjectDTO[]>
}

@Injectable()
export class ProjectService implements AccessValidator {
  constructor(
    private readonly repository: ProjectRepository,
  ) { }

  async create(data: CreateProjectDTO) {
    return this.repository.create(data);
  }

  /* async list(data: CurrentAccountDTO) {
    const methods: ListMethodCommand = {
      'OWNER': this.repository.listByOrganizer,
      'MANAGER': this.repository.listByManager,
      'MEMBER': this.repository.listByMember,
    };

    const result: ProjectDTO[] = await methods[data.role](data.username)
  
    return result;
  } */

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
}
