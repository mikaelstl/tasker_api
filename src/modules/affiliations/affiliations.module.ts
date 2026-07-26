import { Module } from '@nestjs/common';
import { AffiliationController } from './affiliations.controller';
import { AffiliationRepository } from './affiliations.repository';
import { AffiliationService } from './affiliations.service';
import { OrganizationInviteController } from './invites/organization-invite.controller';
import { OrganizationInviteRateLimitGuard } from './invites/organization-invite-rate-limit.guard';
import { OrganizationInviteRepository } from './invites/organization-invite.repository';
import { OrganizationInviteService } from './invites/organization-invite.service';

@Module({
  imports: [],
  controllers: [AffiliationController, OrganizationInviteController],
  providers: [
    AffiliationRepository,
    AffiliationService,
    OrganizationInviteRepository,
    OrganizationInviteService,
    OrganizationInviteRateLimitGuard,
  ],
  exports: [AffiliationRepository, AffiliationService],
})
export class AffiliationModule {}
