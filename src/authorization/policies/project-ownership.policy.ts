import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { OrganizationService } from "@modules/organization/organization.service";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";
import { AccessValidatorRegistry } from "src/authorization/access-control/access-control.registry";

@Injectable()
export class ProjectOwnershipPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService,
    private readonly orgs: OrganizationService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    const isOwner = await this.orgs.belongs(subject.userkey, subject.orgkey)

    return await this.service.belongs(subject.orgkey, subject.targetkey);
  }
}