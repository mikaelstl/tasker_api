import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { $Enums } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";
import { DefineMemberDTO } from "src/DTO/member/member.create.dto";

@Injectable()
export class ProjectMemberRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: DefineMemberDTO) {
    try {
      const result = await this.prisma.member.create({
        data: {
          userkey: data.user,
          projectkey: data.project,
          role: data.role
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async list(projectkey: string) {
    try {
      const projects = await this.prisma.member.findMany({
        where: {
          projectkey: projectkey
        },
        include: {
          tasks: true
        }
      });
      return projects;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.member.delete({
        where: {
          id: id
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}