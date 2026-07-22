import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { CreateImageDTO } from "@modules/upload/dto/image.create.dto";

@Injectable()
export class UploadRepository {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(data: CreateImageDTO) {
    return this.prisma.image.create({
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.image.delete({
      where: {
        id,
      },
    });
  }
}
