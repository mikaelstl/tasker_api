import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { OrganizationService } from "@modules/organization/organization.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrganizationMembershipPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: OrganizationService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    return await this.service.participates(subject.userkey, subject.orgkey);
  }
}