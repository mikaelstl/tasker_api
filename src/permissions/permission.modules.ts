import { Global, Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PermissionGuard } from "@guards/permission.guard";
import { AffiliationModule } from "@modules/affiliations/affiliations.module";
import { AccessControlModule } from "src/authorization/access-control/access-control.module";

@Global()
@Module({
  imports: [
    AffiliationModule,
    AccessControlModule
  ],
  providers: [
    PermissionService,
  ],
  exports: [PermissionService]
})
export class PermissionModule {}