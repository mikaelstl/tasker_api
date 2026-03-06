import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SECRET } from 'src/config/env.config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth.strategy';
import { AccountModule } from '@modules/accounts/account.module';

@Module({
  imports: [
    AccountModule,
    JwtModule.register({
      global: true,
      secret: SECRET,
      signOptions: { expiresIn: '1d' }
    })
  ],
  providers: [ AuthService, JwtStrategy ],
  controllers: [ AuthController ],
  exports: [ AuthService ]
})
export class AuthModule {}
