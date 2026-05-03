import { Module } from "@nestjs/common";
import { ProjectService } from "@modules/projects/project.service";
import { ProjectController } from "@modules/projects/project.controller";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { AffiliationModule } from "@modules/affiliations/affiliations.module";
import { ProjectMembershipPolicy } from "./policies/project-membership.policy";

@Module({
  imports: [
    AffiliationModule,
  ],
  controllers: [
    ProjectController,
  ],
  providers: [
    ProjectRepository,
    ProjectService,
  ],
  exports: [
    ProjectRepository,
    ProjectService,
    ProjectMembershipPolicy
  ]
})
export class ProjectsModule {}