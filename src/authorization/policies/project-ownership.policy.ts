import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { OrganizationService } from "@modules/organization/organization.service";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProjectOwnershipPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService,
    private readonly orgs: OrganizationService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    console.log(subject);
    
    const isOwner = await this.orgs.belongs(
      subject.userkey,
      subject.orgkey
    );

    if (!isOwner) {
      return false;
    }

    if (!subject.targetkey) {
      return true;
    }

    return this.service.belongsToOrganization(
      subject.targetkey,
      subject.orgkey,
    );
  }
}
