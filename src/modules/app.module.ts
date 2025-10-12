import { Module } from '@nestjs/common';
import { AppController } from '../controller/app.controller';
import { AppService } from '../services/app.service';
import { UserModule } from './user.module';
import { DatabaseModule } from '@config/database/database.module';
import { RelationModule } from './relation.module';
import { ProjectsModule } from './projects.module';
import { AuthModule } from '@services/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    RelationModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
