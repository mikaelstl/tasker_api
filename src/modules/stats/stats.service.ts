import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  Prisma,
  ProjectHealthStatus,
  StatsPeriodType,
  TaskStage
} from "generated/prisma";
import { ProjectStatsPeriodSnapshotsRepository } from "./repositories/project-stats-period-snapshots.repository";
import { ProjectStatsPeriodTasksRepository } from "./repositories/project-stats-period-tasks.repository";
import { ProjectStatsQueryRepository } from "./repositories/project-stats-query.repository";
import { ProjectStatsReportsRepository } from "./repositories/project-stats-reports.repository";
import { TaskWorkLogsRepository } from "./repositories/task-work-logs.repository";
import {
  GenerateReportInput,
  GenerateSnapshotInput,
  MemberStats,
  ProjectStats,
  RecordTaskWorkLogInput,
  StatsPeriod,
  StatsTaskRecord,
  StatsUser
} from "./stats.types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const STARTED_STAGES: TaskStage[] = [
  TaskStage.STARTED,
  TaskStage.PENDING,
  TaskStage.IN_PROGRESS
];

@Injectable()
export class StatsService {
  constructor(
    private readonly queries: ProjectStatsQueryRepository,
    private readonly workLogs: TaskWorkLogsRepository,
    private readonly snapshots: ProjectStatsPeriodSnapshotsRepository,
    private readonly periodTasks: ProjectStatsPeriodTasksRepository,
    private readonly reports: ProjectStatsReportsRepository
  ) { }

  async getProjectStats(
    projectkey: string,
    cutoffAt: Date = new Date(),
    period: StatsPeriod | null = null
  ): Promise<ProjectStats> {
    this.assertValidDate(cutoffAt, "cutoffAt");

    const project = await this.queries.findProject(projectkey);

    if (!project) {
      throw new NotFoundException("Projeto não encontrado.");
    }

    const effectivePeriod = period
      ? this.limitPeriodToCutoff(period, cutoffAt)
      : null;
    const logs = await this.workLogs.list(
      {
        projectkey,
        logged_at: effectivePeriod
          ? {
            gte: effectivePeriod.start,
            lte: effectivePeriod.end
          }
          : {
            lte: cutoffAt
          }
      },
      {
        logged_at: "asc"
      }
    );
    const tasks = project.tasks as StatsTaskRecord[];
    const delayedTasks = tasks.filter((task) =>
      this.isTaskDelayed(task, cutoffAt)
    );
    const doneTasks = tasks.filter((task) =>
      task.stage === TaskStage.DONE
    );
    const openTasks = tasks.filter((task) =>
      task.stage !== TaskStage.DONE
    );
    const startedTasks = tasks.filter((task) =>
      STARTED_STAGES.includes(task.stage)
    );
    const reviewTasks = tasks.filter((task) =>
      task.stage === TaskStage.REVIEW
    );
    const progress = tasks.length === 0
      ? 0
      : this.round((doneTasks.length / tasks.length) * 100);
    const logsByTask = this.sumLogsBy(logs, "taskkey");
    const performancePeriod = effectivePeriod ?? {
      start: project.started_at
        ?? logs[0]?.logged_at
        ?? cutoffAt,
      end: cutoffAt
    };
    const members = project.members.map((member) => {
      const memberTasks = tasks.filter((task) =>
        task.ownerkey === member.id
      );

      return this.buildMemberStats(
        member,
        memberTasks,
        logsByTask,
        cutoffAt,
        effectivePeriod
      );
    });
    const health = this.calculateHealth(
      {
        deadline: project.deadline,
        startedAt: project.started_at,
        totalTasks: tasks.length,
        doneTasks: doneTasks.length,
        delayedTasks: delayedTasks.length,
        progress
      },
      cutoffAt
    );

    return {
      generatedAt: new Date(),
      cutoffAt,
      period: effectivePeriod,
      project: {
        id: project.id,
        title: project.title,
        stage: project.stage,
        startedAt: project.started_at,
        doneAt: project.done_at,
        deadline: project.deadline,
        delayed: (
          project.done_at === null
          && project.deadline.getTime() < cutoffAt.getTime()
        ) || (
          project.done_at !== null
          && project.done_at.getTime() > project.deadline.getTime()
        )
      },
      summary: {
        totalTasks: tasks.length,
        doneTasks: doneTasks.length,
        openTasks: openTasks.length,
        startedTasks: startedTasks.length,
        reviewTasks: reviewTasks.length,
        delayedTasks: delayedTasks.length,
        progress
      },
      deadline: {
        dueDate: project.deadline,
        daysLeft: this.daysBetween(cutoffAt, project.deadline)
      },
      health,
      performancePerMember: members.map((member) =>
        this.buildPerformance(member, logs, performancePeriod)
      ),
      productivity: members.map((member) => ({
        memberId: member.memberId,
        completed: member.completedTasks,
        delayed: member.delayedTasks,
        ratio: this.round(
          member.completedTasks / Math.max(member.delayedTasks, 1)
        )
      })),
      members
    };
  }

  async recordTaskWorkLog(input: RecordTaskWorkLogInput) {
    const [task, member] = await Promise.all([
      this.queries.findTask(input.taskkey),
      this.queries.findMember(input.memberkey)
    ]);

    if (!task) {
      throw new NotFoundException("Tarefa não encontrada.");
    }

    if (!member) {
      throw new NotFoundException("Membro não encontrado.");
    }

    if (task.projectkey !== member.projectkey) {
      throw new BadRequestException(
        "A tarefa e o membro devem pertencer ao mesmo projeto."
      );
    }

    if (task.ownerkey !== member.id) {
      throw new BadRequestException(
        "O membro do registro de trabalho deve ser o responsável pela tarefa."
      );
    }

    if (!task.started_at) {
      throw new BadRequestException(
        "A tarefa deve possuir started_at antes que seu tempo de trabalho possa ser registrado."
      );
    }

    const loggedAt = input.loggedAt ?? task.done_at ?? new Date();
    this.assertValidDate(loggedAt, "loggedAt");

    const endAt = task.done_at ?? loggedAt;
    const existingLogs = await this.workLogs.list({
      taskkey: task.id,
      memberkey: member.id,
      logged_at: {
        lte: endAt
      }
    });
    const alreadyRecordedMinutes = existingLogs.reduce(
      (total, log) => total + log.minutes,
      0
    );
    const minutes = Math.max(
      this.elapsedMinutes(task.started_at, endAt) - alreadyRecordedMinutes,
      0
    );

    if (minutes <= 0) {
      throw new BadRequestException(
        "Não há tempo de trabalho da tarefa pendente de registro."
      );
    }

    return this.workLogs.create({
      projectkey: task.projectkey,
      taskkey: task.id,
      memberkey: member.id,
      minutes,
      logged_at: loggedAt,
      note: input.note,
      source: input.source ?? (task.done_at ? "TASK_COMPLETION" : "LIFECYCLE")
    });
  }

  async listTaskWorkLogs(projectkey: string) {
    return this.workLogs.list(
      {
        projectkey
      },
      {
        logged_at: "desc"
      }
    );
  }

  async generateSnapshot(input: GenerateSnapshotInput) {
    const cutoffAt = input.cutoffAt ?? new Date();
    const period = this.normalizePeriod(input.periodType, cutoffAt);
    const stats = await this.getProjectStats(
      input.projectkey,
      cutoffAt,
      period
    );
    const snapshot = await this.snapshots.create({
      projectkey: input.projectkey,
      period_type: input.periodType,
      period_start: period.start,
      period_end: period.end,
      cutoff_at: cutoffAt,
      performance_per_member_json: this.toJson(
        stats.performancePerMember
      ),
      productivity_json: this.toJson(stats.productivity),
      summary_json: this.toJson(stats.summary),
      health_status: stats.health.status,
      health_score: stats.health.score
    });
    const entries = stats.members.flatMap((member) =>
      member.tasks
        .filter((task) =>
          task.spentMinutes > 0
          || this.isInsidePeriod(task.startedAt, period, cutoffAt)
          || this.isInsidePeriod(task.doneAt, period, cutoffAt)
        )
        .map((task) => ({
          snapshotkey: snapshot.id,
          taskkey: task.id,
          memberkey: member.memberId,
          spent_minutes: task.spentMinutes,
          started_at: task.startedAt,
          done_at: task.doneAt
        }))
    );

    try {
      if (entries.length > 0) {
        await this.periodTasks.createMany(entries);
      }
    } catch (error) {
      await this.snapshots.delete(snapshot.id);
      throw error;
    }

    return {
      ...snapshot,
      periodTasks: entries
    };
  }

  async getSnapshot(snapshotkey: string) {
    const snapshot = await this.snapshots.findById(snapshotkey);

    if (!snapshot) {
      throw new NotFoundException("Snapshot de estatísticas não encontrado.");
    }

    const tasks = await this.periodTasks.list(
      {
        snapshotkey
      },
      {
        created_at: "asc"
      }
    );

    return {
      ...snapshot,
      periodTasks: tasks
    };
  }

  async listSnapshots(projectkey: string, periodType?: StatsPeriodType) {
    return this.snapshots.list(
      {
        projectkey,
        period_type: periodType
      },
      {
        cutoff_at: "desc"
      }
    );
  }

  async generateReport(input: GenerateReportInput) {
    const cutoffAt = input.cutoffAt ?? new Date();
    const snapshot = await this.generateSnapshot({
      projectkey: input.projectkey,
      periodType: input.periodType,
      cutoffAt
    });
    const stats = await this.getProjectStats(
      input.projectkey,
      cutoffAt
    );
    const previousSnapshots = await this.snapshots.list(
      {
        projectkey: input.projectkey,
        cutoff_at: {
          lte: cutoffAt
        }
      },
      {
        cutoff_at: "asc"
      }
    );
    const payload = {
      stats,
      snapshot,
      historicalSnapshots: previousSnapshots
    };

    return this.reports.create({
      projectkey: input.projectkey,
      cutoff_at: cutoffAt,
      period_type: input.periodType,
      snapshotkey: snapshot.id,
      file_url: input.fileUrl,
      payload_json: this.toJson(payload)
    });
  }

  async getReport(reportkey: string, projectkey?: string) {
    const report = await this.reports.findById(reportkey);

    if (!report || (
      projectkey !== undefined
      && report.projectkey !== projectkey
    )) {
      throw new NotFoundException("Relatório de estatísticas não encontrado.");
    }

    return report;
  }

  async listReports(projectkey: string) {
    return this.reports.list(
      {
        projectkey
      },
      {
        generated_at: "desc"
      }
    );
  }

  private buildMemberStats(
    member: any,
    tasks: StatsTaskRecord[],
    logsByTask: Map<string, number>,
    cutoffAt: Date,
    period: StatsPeriod | null
  ): MemberStats {
    const user: StatsUser = {
      username: member.user.user.username,
      name: member.user.user.name,
      photoUrl: member.user.user.photo?.url ?? null
    };
    const memberTasks = tasks.map((task) => {
      const loggedMinutes = logsByTask.get(task.id) ?? 0;
      const lifecycleMinutes = this.lifecycleMinutesInPeriod(
        task,
        period,
        cutoffAt
      );

      return {
        id: task.id,
        code: task.code,
        name: task.name,
        stage: task.stage,
        delayed: this.isTaskDelayed(task, cutoffAt),
        spentMinutes: loggedMinutes > 0
          ? loggedMinutes
          : lifecycleMinutes,
        startedAt: task.started_at,
        doneAt: task.done_at
      };
    });

    return {
      memberId: member.id,
      user,
      completedTasks: memberTasks.filter((task) =>
        task.stage === TaskStage.DONE
      ).length,
      delayedTasks: memberTasks.filter((task) =>
        task.delayed
      ).length,
      startedTasks: memberTasks.filter((task) =>
        STARTED_STAGES.includes(task.stage)
      ).length,
      reviewTasks: memberTasks.filter((task) =>
        task.stage === TaskStage.REVIEW
      ).length,
      tasks: memberTasks
    };
  }

  private buildPerformance(
    member: MemberStats,
    logs: Array<{ memberkey: string; minutes: number; logged_at: Date }>,
    period: StatsPeriod
  ) {
    const memberLogs = logs.filter((log) =>
      log.memberkey === member.memberId
    );
    const weeks = new Map<string, number>();

    for (const week of this.listWeeks(period.start, period.end)) {
      weeks.set(this.isoWeekKey(week), 0);
    }

    for (const log of memberLogs) {
      const key = this.isoWeekKey(log.logged_at);
      weeks.set(key, (weeks.get(key) ?? 0) + log.minutes);
    }

    const series = Array.from(weeks.entries()).map(([week, minutes]) => ({
      week,
      hours: this.round(minutes / 60)
    }));
    const totalHours = series.reduce(
      (total, item) => total + item.hours,
      0
    );

    return {
      memberId: member.memberId,
      user: member.user,
      weeks: series,
      averageHoursPerWeek: series.length === 0
        ? 0
        : this.round(totalHours / series.length)
    };
  }

  private calculateHealth(
    data: {
      deadline: Date;
      startedAt: Date | null;
      totalTasks: number;
      doneTasks: number;
      delayedTasks: number;
      progress: number;
    },
    cutoffAt: Date
  ) {
    if (data.totalTasks === 0) {
      return {
        status: ProjectHealthStatus.SAFE,
        score: 100,
        reason: "O projeto não possui trabalho pendente.",
        projectedDeliveryAt: null
      };
    }

    const openTasks = data.totalTasks - data.doneTasks;
    const overdue = data.deadline.getTime() < cutoffAt.getTime()
      && openTasks > 0;
    const startedAt = data.startedAt ?? cutoffAt;
    const totalDuration = Math.max(
      data.deadline.getTime() - startedAt.getTime(),
      DAY_IN_MS
    );
    const elapsed = Math.max(
      cutoffAt.getTime() - startedAt.getTime(),
      0
    );
    const expectedProgress = Math.min(
      (elapsed / totalDuration) * 100,
      100
    );
    const schedulePenalty = Math.max(
      expectedProgress - data.progress,
      0
    );
    const delayedPenalty = (
      data.delayedTasks / data.totalTasks
    ) * 100;
    const score = this.clamp(
      Math.round(100 - schedulePenalty - delayedPenalty),
      0,
      100
    );
    const elapsedDays = Math.max(elapsed / DAY_IN_MS, 1);
    const completedPerDay = data.doneTasks / elapsedDays;
    const projectedDeliveryAt = completedPerDay > 0
      ? new Date(
        cutoffAt.getTime()
        + (openTasks / completedPerDay) * DAY_IN_MS
      )
      : null;
    const projectedLate = projectedDeliveryAt
      ? projectedDeliveryAt.getTime() > data.deadline.getTime()
      : openTasks > 0 && elapsed > 0;

    if (overdue || score < 40) {
      return {
        status: ProjectHealthStatus.CRITICAL,
        score,
        reason: overdue
          ? "O prazo do projeto terminou e ainda há tarefas abertas."
          : "O progresso atual e o trabalho atrasado indicam alto risco de entrega.",
        projectedDeliveryAt
      };
    }

    if (projectedLate || score < 70) {
      return {
        status: ProjectHealthStatus.WARNING,
        score,
        reason: "O ritmo atual de conclusão está próximo ou além do prazo.",
        projectedDeliveryAt
      };
    }

    return {
      status: ProjectHealthStatus.SAFE,
      score,
      reason: "O ritmo atual de conclusão indica entrega dentro do prazo.",
      projectedDeliveryAt
    };
  }

  private normalizePeriod(
    periodType: StatsPeriodType,
    reference: Date
  ): StatsPeriod {
    this.assertValidDate(reference, "cutoffAt");

    const year = reference.getUTCFullYear();
    const month = reference.getUTCMonth();

    if (periodType === StatsPeriodType.MONTH) {
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 1) - 1)
      };
    }

    if (periodType === StatsPeriodType.QUARTER) {
      const quarterStartMonth = Math.floor(month / 3) * 3;

      return {
        start: new Date(Date.UTC(year, quarterStartMonth, 1)),
        end: new Date(Date.UTC(year, quarterStartMonth + 3, 1) - 1)
      };
    }

    if (periodType !== StatsPeriodType.WEEK) {
      throw new BadRequestException("Tipo de período estatístico não suportado.");
    }

    const start = this.startOfIsoWeek(reference);

    return {
      start,
      end: new Date(start.getTime() + (7 * DAY_IN_MS) - 1)
    };
  }

  private limitPeriodToCutoff(
    period: StatsPeriod,
    cutoffAt: Date
  ): StatsPeriod {
    this.assertValidDate(period.start, "period.start");
    this.assertValidDate(period.end, "period.end");

    if (period.start.getTime() > period.end.getTime()) {
      throw new BadRequestException(
        "O início do período deve ser anterior ao fim do período."
      );
    }

    if (cutoffAt.getTime() < period.start.getTime()) {
      throw new BadRequestException(
        "A data de corte deve estar dentro ou depois do período solicitado."
      );
    }

    return {
      start: period.start,
      end: new Date(
        Math.min(period.end.getTime(), cutoffAt.getTime())
      )
    };
  }

  private lifecycleMinutesInPeriod(
    task: StatsTaskRecord,
    period: StatsPeriod | null,
    cutoffAt: Date
  ): number {
    if (!task.started_at) {
      return 0;
    }

    const end = task.done_at && task.done_at.getTime() < cutoffAt.getTime()
      ? task.done_at
      : cutoffAt;
    const start = period && task.started_at.getTime() < period.start.getTime()
      ? period.start
      : task.started_at;
    const limitedEnd = period && end.getTime() > period.end.getTime()
      ? period.end
      : end;

    return this.elapsedMinutes(start, limitedEnd);
  }

  private elapsedMinutes(start: Date, end: Date): number {
    return Math.max(
      Math.floor((end.getTime() - start.getTime()) / MINUTE_IN_MS),
      0
    );
  }

  private isTaskDelayed(task: StatsTaskRecord, cutoffAt: Date): boolean {
    return task.stage === TaskStage.DELAYED
      || (
        task.stage !== TaskStage.DONE
        && task.deadline.getTime() < cutoffAt.getTime()
      )
      || (
        task.stage === TaskStage.DONE
        && task.done_at !== null
        && task.done_at.getTime() > task.deadline.getTime()
      );
  }

  private sumLogsBy(
    logs: Array<{ taskkey: string; minutes: number }>,
    key: "taskkey"
  ): Map<string, number> {
    return logs.reduce((totals, log) => {
      totals.set(log[key], (totals.get(log[key]) ?? 0) + log.minutes);
      return totals;
    }, new Map<string, number>());
  }

  private listWeeks(start: Date, end: Date): Date[] {
    const weeks: Date[] = [];
    let cursor = this.startOfIsoWeek(start);

    while (cursor.getTime() <= end.getTime()) {
      weeks.push(cursor);
      cursor = new Date(cursor.getTime() + 7 * DAY_IN_MS);
    }

    return weeks;
  }

  private startOfIsoWeek(date: Date): Date {
    const start = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
    const day = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - day + 1);
    return start;
  }

  private isoWeekKey(date: Date): string {
    const target = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      (((target.getTime() - yearStart.getTime()) / DAY_IN_MS) + 1) / 7
    );

    return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  private isInsidePeriod(
    value: Date | null,
    period: StatsPeriod,
    cutoffAt: Date
  ): boolean {
    if (!value) {
      return false;
    }

    return value.getTime() >= period.start.getTime()
      && value.getTime() <= Math.min(
        period.end.getTime(),
        cutoffAt.getTime()
      );
  }

  private assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new BadRequestException(`${field} deve ser uma data válida.`);
    }
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private daysBetween(start: Date, end: Date): number {
    const difference = (end.getTime() - start.getTime()) / DAY_IN_MS;
    return difference >= 0
      ? Math.ceil(difference)
      : Math.floor(difference);
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
  }
}
