import { Injectable, Logger, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  AuditAction,
  AuditActorType,
  AuditResource,
  ProjectStage,
  TaskStage,
} from "generated/prisma";
import { PrismaService } from "src/database/prisma.service";
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { DateTime } from 'luxon';

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: "mark-overdue-entities",
    waitForCompletion: true
  })
  async markOverdueEntities(now = DateTime.now().toJSDate()): Promise<{
    projects: number;
    tasks: number;
  }> {
    const [overdueProjects, overdueTasks] = this.audit
      ? await Promise.all([
          this.prisma.project.findMany({
            where: {
              delayed: false,
              deadline: { lt: now },
              stage: { not: ProjectStage.COMPLETED },
            },
            select: { id: true, orgkey: true },
          }),
          this.prisma.task.findMany({
            where: {
              delayed: false,
              deadline: { lt: now },
              stage: { not: TaskStage.DONE },
            },
            select: {
              id: true,
              project: { select: { orgkey: true } },
            },
          }),
        ])
      : [[], []];

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

    const audit = this.audit;
    if (audit) {
      await Promise.all([
        ...overdueProjects.map((project) => audit.log({
          orgkey: project.orgkey,
          actorType: AuditActorType.SYSTEM,
          action: AuditAction.SYSTEM_UPDATE,
          resource: AuditResource.PROJECTS,
          resourcekey: project.id,
          changes: {
            delayed: { oldValue: false, newValue: true },
          },
        })),
        ...overdueTasks.map((task) => audit.log({
          orgkey: task.project.orgkey,
          actorType: AuditActorType.SYSTEM,
          action: AuditAction.SYSTEM_UPDATE,
          resource: AuditResource.TASKS,
          resourcekey: task.id,
          changes: {
            delayed: { oldValue: false, newValue: true },
          },
        })),
      ]);
    }

    return {
      projects: projects.count,
      tasks: tasks.count
    };
  }
}
