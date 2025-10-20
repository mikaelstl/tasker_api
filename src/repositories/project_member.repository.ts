import { ApiResponse } from "@interfaces/response";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { $Enums } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";
import { DefineProjectMember } from "src/DTO/member/member.create.dto";

@Injectable()
export class ProjectMemberRepository {
  constructor(
    // @InjectModel(ProjectMember) private readonly ProjectMembers: typeof ProjectMember
    private readonly prisma: PrismaService
  ) { }

  async create(data: DefineProjectMember) {
    try {
      const result = await this.prisma.projectMember.create({
        data: {
          userkey: data.user,
          projectkey: data.project,
          role: data.role
        }
      });

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.projectMember.delete({
        where: {
          id: id
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}