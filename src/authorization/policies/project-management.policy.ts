import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProjectManagementPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    return await this.service.manage(subject.userkey, subject.targetkey);
  }
}