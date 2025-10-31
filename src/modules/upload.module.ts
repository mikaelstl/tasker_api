import { Module } from "@nestjs/common";
import { UploadService } from "@services/upload.service";
import { UploadController } from "src/controller/upload.controller";
import { UserModule } from "./user.module";
import { UploadRepository } from "@repositories/upload.repository";

@Module({
  imports: [UserModule],
  controllers:[UploadController],
  providers: [UploadService,UploadRepository],
  exports: [UploadService]
})
export class UploadModule {}