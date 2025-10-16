import { MemberRole } from "@models/project_member.model";
import { Injectable, Logger } from "@nestjs/common";
import { ProjectMemberRepository } from "@repositories/project_member.repository";
import { ProjectRepository } from "@repositories/projects.repository";
import { CreateProjectDTO } from "src/DTO/project.create.dto";

@Injectable()
export class ProjectService {
  private logger: Logger = new Logger('ProjectService');

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository
  ) {}

  async create(data: CreateProjectDTO) {
    this.projectRepository.create(data).then(
      async (result) => {
        const { id, ownerkey } = result;
        
        this.logger.log('OWNER is:', result.ownerkey);

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