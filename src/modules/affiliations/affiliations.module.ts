import { Module } from '@nestjs/common';
import { AffiliationController } from './affiliations.controller';
import { AffiliationRepository } from './affiliations.repository';
import { AffiliationsService } from './affiliations.service';
import { AuthModule } from 'src/security/auth.module';
import { JwtAuthGuard } from 'src/security/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/security/auth.service';
import { UserSevice } from '@modules/users/user.service';
import { UserModule } from '@modules/users/user.module';
import { ProjectsModule } from '@modules/projects/projects.module';

@Module({
  imports: [],
  controllers: [AffiliationController],
  providers: [
    AffiliationRepository,
    AffiliationsService
  ],
  exports: [
    AffiliationRepository,
    AffiliationsService
  ]
})
export class AffiliationModule { }
