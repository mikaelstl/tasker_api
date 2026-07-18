import { Injectable } from "@nestjs/common";
import { Prisma } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class ProjectStatsPeriodSnapshotsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: Prisma.ProjectStatsPeriodSnapshotUncheckedCreateInput) {
    return this.prisma.projectStatsPeriodSnapshot.create({
      data
    });
  }

  async findById(id: string) {
    return this.prisma.projectStatsPeriodSnapshot.findUnique({
      where: {
        id
      }
    });
  }

  async findFirst(where: Prisma.ProjectStatsPeriodSnapshotWhereInput) {
    return this.prisma.projectStatsPeriodSnapshot.findFirst({
      where
    });
  }

  async list(
    where: Prisma.ProjectStatsPeriodSnapshotWhereInput = {},
    orderBy?: Prisma.ProjectStatsPeriodSnapshotOrderByWithRelationInput
  ) {
    return this.prisma.projectStatsPeriodSnapshot.findMany({
      where,
      orderBy
    });
  }

  async update(
    id: string,
    data: Prisma.ProjectStatsPeriodSnapshotUncheckedUpdateInput
  ) {
    return this.prisma.projectStatsPeriodSnapshot.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.projectStatsPeriodSnapshot.delete({
      where: {
        id
      }
    });
  }
}
