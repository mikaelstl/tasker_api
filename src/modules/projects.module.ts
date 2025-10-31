import { Module } from "@nestjs/common";
import { CommentsRepository } from "@repositories/comments.repository";
import { EventsRepository } from "@repositories/events.repository";
import { ProjectMemberRepository } from "@repositories/member.repository";
import { TasksRepository } from "@repositories/tasks.repository";
import { ProjectService } from "@services/project.service";
import { EventsController } from "src/controller/events.controller";
import { ProjectController } from "src/controller/project.controller";
import { TasksController } from "src/controller/task.controller";
import { ProjectRepository } from "src/repositories/projects.repository";

@Module({
  controllers: [
    ProjectController,
    TasksController,
    EventsController
  ],
  providers: [
    ProjectRepository,
    TasksRepository,
    EventsRepository,
    ProjectMemberRepository,
    CommentsRepository,
    ProjectService,
  ]
})
export class ProjectsModule {}