import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountRepository } from './account.repository';
import { AccountService } from './account.service';
import { AuthModule } from 'src/security/auth.module';
import { JwtAuthGuard } from 'src/security/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/security/auth.service';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [
    AccountRepository,
    AccountService,
  ],
  exports: [
    AccountRepository
  ]
})
export class AccountModule { }
