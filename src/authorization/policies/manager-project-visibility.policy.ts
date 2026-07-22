import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ManagerProjectVisibilityPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: ProjectService,
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    if (!subject.targetkey) {
      return true;
    }

    const belongsToOrganization = await this.service.belongsToOrganization(
      subject.targetkey,
      subject.orgkey,
    );

    if (!belongsToOrganization) {
      return false;
    }

    const [manages, participates] = await Promise.all([
      this.service.manage(subject.userkey, subject.targetkey),
      this.service.participates(subject.userkey, subject.targetkey),
    ]);

    return manages || participates;
  }
}
