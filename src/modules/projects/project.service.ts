import { Injectable, Logger } from "@nestjs/common";
import { ProjectMemberRepository } from "../members/member.repository";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { $Enums, AccountRole } from "generated/prisma";
import { DefineMemberDTO } from "src/DTO/member/member.create.dto";
import { CreateProjectDTO } from "src/DTO/project/project.create.dto";
import { CurrentAccountDTO } from "src/DTO/user/current-account.dto";
import { ProjectDTO } from "src/DTO/project/project.dto";

type ListMethodCommand = {
  [key: string]: (key: string) => Promise<ProjectDTO[]>
}

@Injectable()
export class ProjectService {
  private logger: Logger = new Logger('ProjectService');

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository
  ) { }

  async create(data: CreateProjectDTO) {
    return this.projectRepository.create(data)/* .then(
      async (result) => {
        const { id, ownerkey } = result;

        const member = await this.projectMemberRepository.create({
          user: ownerkey,
          project: id,
          role: $Enums.MemberRole.OWNER
        });

        return member;
      }
    ) */;
  }

  async addMember(data: DefineMemberDTO) {
    const member = await this.projectMemberRepository.create(data);

    return member;
  }

  async list(data: CurrentAccountDTO) {
    const methods: ListMethodCommand = {
      'ORGANIZER': this.projectRepository.listByOrganizer,
      'MANAGER': this.projectRepository.listByManager,
      'MEMBER': this.projectRepository.listByMember,
    };

    const result: ProjectDTO[] = await methods[data.role](data.username)
  }
}