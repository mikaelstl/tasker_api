import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ProjectStage, TaskStage } from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: "mark-overdue-entities",
    waitForCompletion: true
  })
  async markOverdueEntities(now = new Date()): Promise<{
    projects: number;
    tasks: number;
  }> {
    const [projects, tasks] = await this.prisma.$transaction([
      this.prisma.project.updateMany({
        where: {
          delayed: false,
          deadline: { lt: now },
          stage: { not: ProjectStage.COMPLETED }
        },
        data: { delayed: true }
      }),
      this.prisma.task.updateMany({
        where: {
          delayed: false,
          deadline: { lt: now },
          stage: { not: TaskStage.DONE }
        },
        data: { delayed: true }
      })
    ]);

    if (projects.count > 0 || tasks.count > 0) {
      this.logger.log(
        `Marked ${projects.count} project(s) and ${tasks.count} task(s) as delayed.`
      );
    }

    return {
      projects: projects.count,
      tasks: tasks.count
    };
  }
}
