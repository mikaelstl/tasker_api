import { Module } from "@nestjs/common";
import { CheckpointsRepository } from "@repositories/checkpoints.repository";
import { ProjectMemberRepository } from "@repositories/project_member.repository";
import { TasksRepository } from "@repositories/tasks.repository";
import { ProjectService } from "@services/project.service";
import { CheckpointsController } from "src/controller/checkpoint.controller";
import { ProjectController } from "src/controller/project.controller";
import { TasksController } from "src/controller/task.controller";
import { ProjectRepository } from "src/repositories/projects.repository";

@Module({
  controllers: [
    ProjectController,
    TasksController,
    CheckpointsController
  ],
  providers: [
    ProjectRepository,
    TasksRepository,
    CheckpointsRepository,
    ProjectMemberRepository,
    ProjectService
  ]
})
export class ProjectsModule {}