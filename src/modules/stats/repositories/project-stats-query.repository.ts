import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class ProjectStatsQueryRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async findProject(projectkey: string) {
    return this.prisma.project.findUnique({
      where: {
        id: projectkey
      },
      include: {
        tasks: {
          orderBy: {
            created_at: "asc"
          }
        },
        members: {
          include: {
            user: {
              include: {
                user: {
                  include: {
                    photo: true
                  }
                }
              }
            }
          },
          orderBy: {
            created_at: "asc"
          }
        }
      }
    });
  }

  async findTask(taskkey: string) {
    return this.prisma.task.findUnique({
      where: {
        id: taskkey
      }
    });
  }

  async findMember(memberkey: string) {
    return this.prisma.member.findUnique({
      where: {
        id: memberkey
      }
    });
  }
}
