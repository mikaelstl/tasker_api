import { Injectable, Logger } from "@nestjs/common";
import { MembersRepository } from "@modules/members/member.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { $Enums, OrgRole } from "generated/prisma";
import { DefineMemberDTO } from "@modules/members/dto/member.create.dto";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";
import { AccessValidator } from "src/common/interfaces/AccessValidator";

type ListMethodCommand = {
  [K in OrgRole]: (key: string) => Promise<ProjectDTO[]>
}

@Injectable()
export class ProjectService implements AccessValidator {
  private readonly logger: Logger = new Logger('ProjectService');

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
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          ownerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to verify project ownership.", err);
      return false;
    }
  }

  public async manage(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.exists(
        targetkey,
        {
          id: targetkey,
          managerkey: subjectkey
        }
      );

      return result;
    } catch (err) {
      this.logger.warn("[ERROR] to check the project manager.", err);
      return false;
    }
  }

  public async participates(subjectkey: string, targetkey: string): Promise<boolean> {
    try {
      const result = await this.repository.find(targetkey);

      const value = result.members.find(m => m.userkey === subjectkey);

      return !!value;
    } catch (err: any) {
      this.logger.warn("[ERROR] to verify project membership.", err);
      return false;
    }
  }
}