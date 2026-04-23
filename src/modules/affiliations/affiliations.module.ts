import { Module } from '@nestjs/common';
import { AffiliationController } from './affiliations.controller';
import { AffiliationRepository } from './affiliations.repository';
import { AffiliationService } from './affiliations.service';

@Module({
  imports: [],
  controllers: [AffiliationController],
  providers: [
    AffiliationRepository,
    AffiliationService
  ],
  exports: [
    AffiliationRepository,
    AffiliationService
  ]
})
export class AffiliationModule { }
