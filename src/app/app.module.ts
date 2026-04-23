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

@Module({
  imports: [
    PrismaModule,
    // UploadModule,
    AccountModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    ProjectsModule,
    AffiliationModule,
    PermissionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
