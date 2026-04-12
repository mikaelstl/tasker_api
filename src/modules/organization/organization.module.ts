import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';
import { UserModule } from '@modules/users/user.module';
import { ProjectsModule } from '@modules/projects/projects.module';
import { AffiliationModule } from '@modules/affiliations/affiliations.module';

@Module({
  imports: [
    UserModule,
    ProjectsModule,
    AffiliationModule
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationRepository,
    OrganizationService
  ],
  exports: [
    OrganizationRepository
  ]
})
export class OrganizationModule { }
