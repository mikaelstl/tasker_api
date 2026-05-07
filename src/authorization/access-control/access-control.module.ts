import { Global, Module } from "@nestjs/common";
import { AccessControlBootstrap } from "./access-control.bootstrap";
import { AccessValidatorRegistry } from "./access-control.registry";
import { PoliciesModule } from "@authorization/policies/policies.module";

@Module({
  imports: [
    PoliciesModule
  ],
  providers: [
    AccessControlBootstrap,
    AccessValidatorRegistry
  ],
  exports: [AccessValidatorRegistry]
})
export class AccessControlModule {}