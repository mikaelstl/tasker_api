import { Injectable } from "@nestjs/common";
import { Prisma } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class ProjectStatsReportsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: Prisma.ProjectStatsReportUncheckedCreateInput) {
    return this.prisma.projectStatsReport.create({
      data
    });
  }

  async findById(id: string) {
    return this.prisma.projectStatsReport.findUnique({
      where: {
        id
      }
    });
  }

  async findFirst(where: Prisma.ProjectStatsReportWhereInput) {
    return this.prisma.projectStatsReport.findFirst({
      where
    });
  }

  async list(
    where: Prisma.ProjectStatsReportWhereInput = {},
    orderBy?: Prisma.ProjectStatsReportOrderByWithRelationInput
  ) {
    return this.prisma.projectStatsReport.findMany({
      where,
      orderBy
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectStatsReportUncheckedUpdateInput
  ) {
    return this.prisma.projectStatsReport.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.projectStatsReport.delete({
      where: {
        id
      }
    });
  }
}
