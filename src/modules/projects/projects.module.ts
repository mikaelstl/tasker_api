import { Module } from "@nestjs/common";
import { CommentsRepository } from "../comments/comments.repository";
import { EventsRepository } from "../events/events.repository";
import { MembersRepository } from "../members/member.repository";
import { TasksRepository } from "@modules/tasks/tasks.repository";
import { ProjectService } from "@modules/projects/project.service";
import { CommentsController } from "@modules/comments/comment.controller";
import { EventsController } from "@modules/events/events.controller";
import { ProjectController } from "@modules/projects/project.controller";
import { TasksController } from "@modules/tasks/task.controller";
import { ProjectRepository } from "@modules/projects/projects.repository";

@Module({
  controllers: [
    ProjectController,
    TasksController,
    EventsController,
    CommentsController
  ],
  providers: [
    ProjectRepository,
    TasksRepository,
    EventsRepository,
    MembersRepository,
    CommentsRepository,
    ProjectService,
  ],
  exports: [
    ProjectRepository
  ]
})
export class ProjectsModule {}