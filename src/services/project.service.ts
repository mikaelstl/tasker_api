import { MemberRole } from "@models/project_member.model";
import { Injectable, Logger } from "@nestjs/common";
import { ProjectMemberRepository } from "@repositories/project_member.repository";
import { ProjectRepository } from "@repositories/projects.repository";
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
          role: MemberRole.OWNER
        });

        return member;
      }
    );
  }
}