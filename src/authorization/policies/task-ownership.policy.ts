import { AccessSubject } from "@interfaces/AccessContext";
import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { TasksService } from "@modules/tasks/tasks.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TasksOwnershipPolicy implements ResourcePolicyHandler {  
  constructor(
    private readonly service: TasksService
  ) {}

  async validate(subject: AccessSubject): Promise<boolean> {
    if (subject.projectkey && subject.taskcode) {
      return this.service.ownsTask(
        subject.userkey,
        subject.projectkey,
        subject.taskcode,
      );
    }

    return await this.service.belongs(subject.userkey, subject.targetkey);
  }
}
