import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { TasksService } from "@modules/tasks/tasks.service";
import { Injectable } from "@nestjs/common";
import { AccessValidatorRegistry } from "src/authorization/access-control/access-control.registry";

@Injectable()
export class TasksOwnershipPolicy implements ResourcePolicyHandler {  
  constructor(
    private readonly service: TasksService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    return await this.service.belongs(subject.userkey, subject.targetkey);
  }
}