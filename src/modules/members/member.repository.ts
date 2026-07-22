import { Injectable } from '@nestjs/common';
import { $Enums } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";
import { DefineMemberDTO } from "@modules/members/dto/member.create.dto";

@Injectable()
export class MembersRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: DefineMemberDTO) {
    return this.prisma.member.create({
      data: {
        userkey: data.user,
        projectkey: data.project,
      },
    });
  }

  async list(projectkey: string) {
    return this.prisma.member.findMany({
      where: {
        projectkey,
      },
      include: {
        tasks: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.member.delete({
      where: {
        id,
      },
    });
  }

  async participates(projectkey: string, userkey: string) {
    const result = await this.prisma.member.count({
      where: {
        projectkey: projectkey,
        userkey: userkey
      }
    });

    return result > 0;
  }
}
