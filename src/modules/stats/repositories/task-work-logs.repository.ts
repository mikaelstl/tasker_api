import { Injectable } from "@nestjs/common";
import { Prisma } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class TaskWorkLogsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: Prisma.TaskWorkLogUncheckedCreateInput) {
    return this.prisma.taskWorkLog.create({
      data
    });
  }

  async createMany(data: Prisma.TaskWorkLogCreateManyInput[]) {
    return this.prisma.taskWorkLog.createMany({
      data
    });
  }

  async findById(id: string) {
    return this.prisma.taskWorkLog.findUnique({
      where: {
        id
      }
    });
  }

  async findFirst(where: Prisma.TaskWorkLogWhereInput) {
    return this.prisma.taskWorkLog.findFirst({
      where
    });
  }

  async list(
    where: Prisma.TaskWorkLogWhereInput = {},
    orderBy?: Prisma.TaskWorkLogOrderByWithRelationInput
  ) {
    return this.prisma.taskWorkLog.findMany({
      where,
      orderBy
    });
  }

  async update(
    id: string,
    data: Prisma.TaskWorkLogUncheckedUpdateInput
  ) {
    return this.prisma.taskWorkLog.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.taskWorkLog.delete({
      where: {
        id
      }
    });
  }
}
