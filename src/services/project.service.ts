import { Injectable, Logger } from "@nestjs/common";
import { ProjectMemberRepository } from "@repositories/project_member.repository";
import { ProjectRepository } from "@repositories/projects.repository";
import { $Enums } from "generated/prisma";
import { DefineProjectMember } from "src/DTO/member/member.create.dto";
import { CreateProjectDTO } from "src/DTO/project/project.create.dto";

@Injectable()
export class ProjectService {
  private logger: Logger = new Logger('ProjectService');

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository
  ) {}

  async create(data: CreateProjectDTO) {
    return this.projectRepository.create(data).then(
      async (result) => {
        const { id, ownerkey } = result;
      
        const member = await this.projectMemberRepository.create({
          user: ownerkey,
          project: id,
          role: $Enums.MemberRole.OWNER
        });

        return member;
      }
    );
  }

  async addMember(data: DefineProjectMember) {
    const member = await this.projectMemberRepository.create(data);

    return member;
  }
}