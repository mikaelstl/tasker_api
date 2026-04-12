import { Module } from '@nestjs/common';
import { AffiliationController } from './affiliations.controller';
import { AffiliationRepository } from './affiliations.repository';
import { AffiliationsService } from './affiliations.service';

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
