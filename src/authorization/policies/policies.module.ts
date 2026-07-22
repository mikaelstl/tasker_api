import { Global, Module } from "@nestjs/common";
import { TasksOwnershipPolicy } from "./task-ownership.policy";
import { ProjectOwnershipPolicy } from "./project-ownership.policy";
import { CommentOwnershipPolicy } from "./comment-ownership.policy";
import { ProjectManagementPolicy } from "./project-management.policy";
import { ProjectMembershipPolicy } from "./project-membership.policy";
import { OrganizationOwnershipPolicy } from "./organization-ownership.policy";
import { OrganizationMembershipPolicy } from "./organization-membership.policy";
import { TasksModule } from "@modules/tasks/tasks.module";
import { ProjectsModule } from "@modules/projects/projects.module";
import { OrganizationModule } from "@modules/organization/organization.module";
import { CommentsModule } from "@modules/comments/comments.module";
import { ManagerProjectVisibilityPolicy } from "./manager-project-visibility.policy";
import { MemberProjectVisibilityPolicy } from "./member-project-visibility.policy";

@Global()
@Module({
  imports: [
    TasksModule,
    ProjectsModule,
    OrganizationModule,
    CommentsModule
  ],
  providers: [
    TasksOwnershipPolicy,
    ProjectOwnershipPolicy,
    CommentOwnershipPolicy,
    ProjectManagementPolicy,
    ProjectMembershipPolicy,
    OrganizationOwnershipPolicy,
    OrganizationMembershipPolicy,
    ManagerProjectVisibilityPolicy,
    MemberProjectVisibilityPolicy,
  ],
  exports: [
    TasksOwnershipPolicy,
    ProjectOwnershipPolicy,
    CommentOwnershipPolicy,
    ProjectManagementPolicy,
    ProjectMembershipPolicy,
    OrganizationOwnershipPolicy,
    OrganizationMembershipPolicy,
    ManagerProjectVisibilityPolicy,
    MemberProjectVisibilityPolicy,
  ]
})
export class PoliciesModule {}
