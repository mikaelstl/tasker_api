import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../modules/users/user.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { AuthModule } from '../security/auth.module';
import { PrismaModule } from 'src/database/prisma.module';
import { UploadModule } from '../modules/upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    // UploadModule,
    AuthModule,
    UserModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
