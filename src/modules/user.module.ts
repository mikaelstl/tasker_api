import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserController } from "src/controller/user.controller";
import { UserRepository } from "src/repositories/user.repository";
import { AuthService } from "src/services/auth.service";
import { JwtAuthGuard } from "src/services/auth/auth.guard";

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