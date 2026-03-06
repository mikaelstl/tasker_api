import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserController } from "@modules/users/user.controller";
import { UserRepository } from "@modules/users/user.repository";
import { AuthService } from "src/security/auth.service";
import { JwtAuthGuard } from "../../security/auth.guard";

@Module({
  imports: [],
  controllers: [ UserController ],
  providers: [
    UserRepository,
    AuthService,
    JwtService,
    JwtAuthGuard
  ],
  exports: [ UserRepository ]
})
export class UserModule {}