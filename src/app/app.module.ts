import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../modules/users/user.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { AuthModule } from '../security/auth.module';
import { PrismaModule } from 'src/database/prisma.module';
import { UploadModule } from '../modules/upload/upload.module';
import { AccountModule } from '@modules/accounts/account.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { PermissionModule } from '@permissions/permission.modules';
import { AffiliationModule } from '@modules/affiliations/affiliations.module';
import { AccessControlModule } from 'src/authorization/access-control/access-control.module';
import { PoliciesModule } from '@authorization/policies/policies.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DeadlinesModule } from '@modules/deadlines/deadlines.module';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { MembersModule } from '@modules/members/members.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { CommentsModule } from '@modules/comments/comments.module';
import { EventsModule } from '@modules/events/events.module';
import { StatsModule } from '@modules/stats/stats.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PermissionModule,
    AccessControlModule,
    PoliciesModule,
    AccountModule,
    AuthModule,
    UserModule,
    // UploadModule,
    OrganizationModule,
    AffiliationModule,
    ProjectsModule,
    MembersModule,
    TasksModule,
    CommentsModule,
    EventsModule,
    StatsModule,
    DeadlinesModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
