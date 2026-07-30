import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { ProjectScopeResolver } from "@authorization/resolvers/project-scope.resolver";
import { Resources } from "@enums/Resources.enum";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProjectManagementPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService,
    private readonly projectScopeResolver: ProjectScopeResolver,
  ) {}

  async validate(
    subject: AccessSubject,
    resource: Resources,
  ): Promise<boolean> {
    const projectkey = await this.projectScopeResolver.resolve(
      resource,
      subject,
    );

    if (!projectkey) {
      return false;
    }

    return await this.service.manage(
      subject.userkey,
      projectkey,
      subject.orgkey,
    );
  }
}
