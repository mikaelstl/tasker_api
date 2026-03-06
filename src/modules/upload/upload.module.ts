import { Module } from "@nestjs/common";
import { UploadService } from "@modules/upload/upload.service";
import { UploadController } from "@modules/upload/upload.controller";
import { UserModule } from "../users/user.module";
import { UploadRepository } from "@modules/upload/upload.repository";

@Module({
  imports: [UserModule],
  controllers:[UploadController],
  providers: [UploadService,UploadRepository],
  exports: [UploadService]
})
export class UploadModule {}