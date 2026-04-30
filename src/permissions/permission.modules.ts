import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PermissionGuard } from "@guards/permission.guard";
import { AffiliationModule } from "@modules/affiliations/affiliations.module";

@Module({
  imports: [
    AffiliationModule
  ],
  providers: [
    PermissionService,
    PermissionGuard,
  ],
  exports: [ PermissionGuard ]
})
export class PermissionModule {}