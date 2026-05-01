import { Module } from "@nestjs/common";
import { ProjectService } from "@modules/projects/project.service";
import { ProjectController } from "@modules/projects/project.controller";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { AffiliationModule } from "@modules/affiliations/affiliations.module";

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
  ]
})
export class ProjectsModule {}