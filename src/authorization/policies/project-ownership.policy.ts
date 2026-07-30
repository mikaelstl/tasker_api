import { ProjectScopeResolver } from "@authorization/resolvers/project-scope.resolver";
import { Resources } from "@enums/Resources.enum";
import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { OrganizationService } from "@modules/organization/organization.service";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProjectOwnershipPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService,
    private readonly projectScopeResolver: ProjectScopeResolver,
    private readonly orgs: OrganizationService
  ) {}

  async validate(subject: AccessSubject, resource: Resources): Promise<boolean> {
    const projectkey = await this.projectScopeResolver.resolve(
      resource,
      subject,
    );
    
    const isOwner = await this.orgs.belongs(
      subject.userkey,
      subject.orgkey
    );

    if (!isOwner) {
      return false;
    }

    if (!projectkey) {
      return true;
    }

    return this.service.belongsToOrganization(
      projectkey,
      subject.orgkey,
    );
  }
}
