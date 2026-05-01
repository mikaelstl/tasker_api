import { PermissionGuard } from "@guards/permission.guard";
import { AffiliationModule } from "@modules/affiliations/affiliations.module";
import { CommentsModule } from "@modules/comments/comments.module";
import { EventsModule } from "@modules/events/events.module";
import { MembersModule } from "@modules/members/members.module";
import { OrganizationModule } from "@modules/organization/organization.module";
import { ProjectsModule } from "@modules/projects/projects.module";
import { TasksModule } from "@modules/tasks/tasks.module";
import { PermissionService } from "@permissions/permission.service";
import { AccessValidatorService } from "./access_validator.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    OrganizationModule,
    AffiliationModule,
    ProjectsModule,
    TasksModule,
    EventsModule,
    CommentsModule,
    MembersModule
  ],
  providers: [
    AccessValidatorService
  ],
  exports: []
})
export class ValidatorModule {}