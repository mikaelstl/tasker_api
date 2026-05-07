import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { CommentsService } from "@modules/comments/comments.service";
import { Injectable } from "@nestjs/common";
import { AccessValidatorRegistry } from "src/authorization/access-control/access-control.registry";

@Injectable()
export class CommentOwnershipPolicy implements ResourcePolicyHandler {
  constructor(
    private readonly service: CommentsService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    return await this.service.belongs(subject.userkey, subject.targetkey);
  }
}