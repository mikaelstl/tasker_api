import { Module } from "@nestjs/common";
import { MembersRepository } from "@modules/members/member.repository";
import { MemberController } from "@modules/members/member.controller";
import { MembersService } from "./members.service";
import { PermissionModule } from "@permissions/permission.modules";

@Module({
  imports: [
    PermissionModule
  ],
  controllers: [
    MemberController,
  ],
  providers: [
    MembersRepository,
    MembersService,
  ],
  exports: [
    MembersService
  ]
})
export class MembersModule {}