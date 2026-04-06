import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CreateImageDTO } from "@modules/upload/dto/image.create.dto";

@Injectable()
export class UploadRepository {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(data: CreateImageDTO) {
    try {
      const image = this.prisma.image.create({
        data: data
      })

      return image
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const image = this.prisma.image.delete({
        where: {
          id
        }
      })

      return image
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}