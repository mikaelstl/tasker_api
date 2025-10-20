import { Module } from '@nestjs/common';
import { AppController } from '../controller/app.controller';
import { AppService } from '../services/app.service';
import { UserModule } from './user.module';
import { ProjectsModule } from './projects.module';
import { AuthModule } from '@services/auth/auth.module';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
