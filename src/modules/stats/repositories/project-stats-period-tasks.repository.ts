import { Injectable } from "@nestjs/common";
import { Prisma } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class ProjectStatsPeriodTasksRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: Prisma.ProjectStatsPeriodTaskUncheckedCreateInput) {
    return this.prisma.projectStatsPeriodTask.create({
      data
    });
  }

  async createMany(data: Prisma.ProjectStatsPeriodTaskCreateManyInput[]) {
    return this.prisma.projectStatsPeriodTask.createMany({
      data
    });
  }

  async findById(id: string) {
    return this.prisma.projectStatsPeriodTask.findUnique({
      where: {
        id
      }
    });
  }

  async findFirst(where: Prisma.ProjectStatsPeriodTaskWhereInput) {
    return this.prisma.projectStatsPeriodTask.findFirst({
      where
    });
  }

  async list(
    where: Prisma.ProjectStatsPeriodTaskWhereInput = {},
    orderBy?: Prisma.ProjectStatsPeriodTaskOrderByWithRelationInput
  ) {
    return this.prisma.projectStatsPeriodTask.findMany({
      where,
      orderBy
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectStatsPeriodTaskUncheckedUpdateInput
  ) {
    return this.prisma.projectStatsPeriodTask.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.projectStatsPeriodTask.delete({
      where: {
        id
      }
    });
  }
}
