import { Injectable, Optional } from '@nestjs/common';
import {
  Prisma,
  AuditAction,
  AuditResource,
  ProjectHealthStatus,
  TaskStage
} from "generated/prisma";
import { ProjectStatsPeriodSnapshotsRepository } from "./repositories/project-stats-period-snapshots.repository";
import { ProjectStatsPeriodTasksRepository } from "./repositories/project-stats-period-tasks.repository";
import { ProjectStatsQueryRepository } from "./repositories/project-stats-query.repository";
import { ProjectStatsReportsRepository } from "./repositories/project-stats-reports.repository";
import { TaskWorkLogsRepository } from "./repositories/task-work-logs.repository";
import { ProjectStatsReportDocument } from "./project-stats-report.document";
import {
  GeneratedProjectReport,
  GenerateReportInput,
  GenerateSnapshotInput,
  MemberStats,
  ProjectMemberPerformance,
  ProjectStats,
  RecordTaskWorkLogInput,
  StatsPeriod,
  StatsTaskRecord,
  StatsUser
} from "./stats.types";
import { InternalException } from 'src/common/errors/internal.exception';
import { ValidationException } from 'src/common/errors/validation.exception';
import { InvalidPeriodTime } from 'src/common/errors/invalid-period-time.exception';
import { ProjectNotFoundException } from 'src/common/errors/project-not-found.exception';
import {
  MemberNotFoundException,
  StatsReportNotFoundException,
  StatsSnapshotNotFoundException,
  TaskNotFoundException,
} from 'src/common/errors/resource-not-found.exceptions';
import {
  NoPendingTaskWorkTimeException,
  TaskMemberProjectMismatchException,
  TaskNotStartedException,
  TaskWorkLogOwnerMismatchException,
} from 'src/common/errors/task-business.exceptions';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { AuditContext } from '@interfaces/AuditContext';
import { DateTime } from 'luxon';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const STARTED_STAGES: TaskStage[] = [
  TaskStage.STARTED
];

type StatsTaskDetails = {
  id: string;
  code: string;
  name: string;
  stage: TaskStage;
  delayed: boolean;
  spentMinutes: number;
  deadline: Date;
  startedAt: Date | null;
  doneAt: Date | null;
};

@Injectable()
export class StatsService {
  constructor(
    private readonly queries: ProjectStatsQueryRepository,
    private readonly workLogs: TaskWorkLogsRepository,
    private readonly snapshots: ProjectStatsPeriodSnapshotsRepository,
    private readonly periodTasks: ProjectStatsPeriodTasksRepository,
    private readonly reports: ProjectStatsReportsRepository,
    private readonly reportDocument: ProjectStatsReportDocument,
    @Optional() private readonly audit?: AuditLogService,
  ) { }

  async getProjectStats(
    projectkey: string,
    month?: string | Date,
  ): Promise<ProjectStats> {
    const period = this.resolveMonth(month);
    return (await this.collectProjectStats(projectkey, period)).stats;
  }

  async getProjectMemberStats(
    projectkey: string,
    month?: string | Date
  ): Promise<MemberStats[]> {
    const stats = await this.getProjectStats(projectkey, month);

    return stats.members;
  }

  async getProjectMemberPerformance(
    projectkey: string,
    month?: string | Date
  ): Promise<ProjectMemberPerformance> {
    const stats = await this.getProjectStats(projectkey, month);
    const performanceByMember = new Map(
      stats.performancePerMember.map((performance) => [
        performance.memberId,
        performance
      ])
    );

    return {
      generatedAt: stats.generatedAt,
      month: stats.month,
      project: {
        id: stats.project.id,
        title: stats.project.title
      },
      members: stats.members.map((member) => {
        const performance = performanceByMember.get(member.memberId);
        const totalTasks = member.tasks.length;
        const spentMinutes = member.tasks.reduce(
          (total, task) => total + task.spentMinutes,
          0
        );

        return {
          memberId: member.memberId,
          user: member.user,
          totalTasks,
          completedTasks: member.completedTasks,
          completionRate: totalTasks === 0
            ? 0
            : this.round((member.completedTasks / totalTasks) * 100),
          delayedTasks: member.delayedTasks,
          delayRate: totalTasks === 0
            ? 0
            : this.round((member.delayedTasks / totalTasks) * 100),
          startedTasks: member.startedTasks,
          reviewTasks: member.reviewTasks,
          spentMinutes,
          spentHours: this.round(spentMinutes / 60),
          averageHoursPerMonth: performance?.averageHoursPerMonth ?? 0,
          averageHoursPerTask: performance?.averageHoursPerTask ?? 0,
          months: performance?.months ?? [],
          weeks: performance?.months[0]?.weeks ?? []
        };
      })
    };
  }

  async recordTaskWorkLog(input: RecordTaskWorkLogInput) {
    const [task, member] = await Promise.all([
      this.queries.findTask(input.taskkey),
      this.queries.findMember(input.memberkey)
    ]);

    if (!task) {
      throw new TaskNotFoundException();
    }

    if (!member) {
      throw new MemberNotFoundException();
    }

    if (task.projectkey !== member.projectkey) {
      throw new TaskMemberProjectMismatchException();
    }

    if (task.ownerkey !== member.id) {
      throw new TaskWorkLogOwnerMismatchException();
    }

    if (!task.started_at) {
      throw new TaskNotStartedException();
    }

    const loggedAt = input.loggedAt ?? task.done_at ?? DateTime.now().toJSDate();
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
      throw new NoPendingTaskWorkTimeException();
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
    const period = this.resolveMonth(input.month);
    const { stats, memberTaskDetailsByMemberId } =
      await this.collectProjectStats(
        input.projectkey,
        period
      );
    const effectivePeriod = stats.period;
    const snapshot = await this.snapshots.create({
      projectkey: input.projectkey,
      period_type: 'MONTH',
      period_start: period.start,
      period_end: period.end,
      cutoff_at: period.end,
      performance_per_member_json: this.toJson(
        stats.performancePerMember
      ),
      productivity_json: this.toJson(stats.productivity),
      summary_json: this.toJson(stats.summary),
      health_status: stats.health.status,
      health_score: stats.health.score
    });
    const entries = Array.from(memberTaskDetailsByMemberId.entries()).flatMap(
      ([memberId, tasks]) =>
        tasks
          .filter((task) =>
            task.spentMinutes > 0
            || this.isInsidePeriod(task.startedAt, effectivePeriod)
            || this.isInsidePeriod(task.doneAt, effectivePeriod)
          )
          .map((task) => ({
            snapshotkey: snapshot.id,
            taskkey: task.id,
            memberkey: memberId,
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
      throw new InternalException('Falha ao gerar o snapshot de estatísticas.', error);
    }

    return {
      ...snapshot,
      periodTasks: entries
    };
  }

  async getSnapshot(snapshotkey: string) {
    const snapshot = await this.snapshots.findById(snapshotkey);

    if (!snapshot) {
      throw new StatsSnapshotNotFoundException();
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

  async listSnapshots(projectkey: string) {
    return this.snapshots.list(
      {
        projectkey,
        period_type: 'MONTH'
      },
      {
        cutoff_at: "desc"
      }
    );
  }

  async generateReport(
    input: GenerateReportInput,
    context?: AuditContext,
  ): Promise<GeneratedProjectReport> {
    const period = this.resolveMonth(input.month);
    const snapshot = await this.generateSnapshot({
      projectkey: input.projectkey,
      month: input.month
    });
    const stats = await this.getProjectStats(
      input.projectkey,
      input.month
    );
    const previousSnapshots = await this.snapshots.list(
      {
        projectkey: input.projectkey,
        period_type: 'MONTH',
        cutoff_at: { lte: period.end }
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

    const report = await this.reports.create({
      projectkey: input.projectkey,
      cutoff_at: period.end,
      period_type: 'MONTH',
      snapshotkey: snapshot.id,
      payload_json: this.toJson(payload)
    });
    let document: Buffer;

    try {
      document = await this.reportDocument.generate({
        reportId: report.id,
        stats,
        historicalSnapshots: previousSnapshots
      });
    } catch (error) {
      await this.reports.delete(report.id);
      throw new InternalException('Falha ao gerar o relatório de estatísticas.', error);
    }

    if (context) {
      await this.audit?.logUserMutation({
        ...context,
        action: AuditAction.CREATE,
        resource: AuditResource.PROJECT_STATS,
        resourcekey: report.id,
        after: report as unknown as Record<string, unknown>,
        fields: ['projectkey', 'period_type', 'cutoff_at'],
      });
    }

    return {
      filename: this.reportFilename(stats.project.title, period.start),
      document
    };
  }

  async getReport(reportkey: string, projectkey?: string) {
    const report = await this.reports.findById(reportkey);

    if (!report || (
      projectkey !== undefined
      && report.projectkey !== projectkey
    )) {
      throw new StatsReportNotFoundException();
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
    periodEnd: Date,
    period: StatsPeriod | null
  ): MemberStats {
    const user: StatsUser = {
      affiliationId: member.user.id,
      username: member.user.user.username,
      name: member.user.user.name,
      photoUrl: member.user.user.photo?.url ?? null
    };
    const memberTaskDetails = this.buildMemberTaskDetails(
      tasks,
      logsByTask,
      periodEnd,
      period
    );
    const memberTasks = memberTaskDetails.map(({ id, startedAt, doneAt, ...task }) =>
      task
    );

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

  private buildMemberTaskDetails(
    tasks: StatsTaskRecord[],
    logsByTask: Map<string, number>,
    periodEnd: Date,
    period: StatsPeriod | null
  ): StatsTaskDetails[] {
    return tasks.map((task) => {
      const loggedMinutes = logsByTask.get(task.id) ?? 0;
      const lifecycleMinutes = this.lifecycleMinutesInPeriod(
        task,
        period,
        periodEnd
      );

      return {
        id: task.id,
        code: task.code,
        name: task.name,
        stage: task.stage,
        delayed: this.isTaskDelayed(task),
        spentMinutes: loggedMinutes > 0
          ? loggedMinutes
          : lifecycleMinutes,
        deadline: task.deadline,
        startedAt: task.started_at,
        doneAt: task.done_at
      };
    });
  }

  private buildPerformance(
    member: MemberStats,
    logs: Array<{ memberkey: string; minutes: number; logged_at: Date }>,
    period: StatsPeriod
  ) {
    const memberLogs = logs.filter((log) =>
      log.memberkey === member.memberId
    );
    const months = new Map<string, {
      minutes: number;
      weeks: number;
      weeklyMinutes: Map<string, number>;
    }>();

    for (const month of this.listMonths(period.start, period.end)) {
      const monthEnd = DateTime.fromJSDate(month, { zone: 'utc' })
        .plus({ months: 1 })
        .startOf('month')
        .toJSDate();
      months.set(this.monthKey(month), {
        minutes: 0,
        weeks: Math.max(
          this.listWeeks(month, monthEnd).length,
          1
        ),
        weeklyMinutes: new Map()
      });
    }

    for (const log of memberLogs) {
      const key = this.monthKey(log.logged_at);
      const value = months.get(key);

      if (value) {
        value.minutes += log.minutes;
        const week = this.startOfIsoWeek(log.logged_at);
        const weekKey = this.weekKey(week);
        value.weeklyMinutes.set(
          weekKey,
          (value.weeklyMinutes.get(weekKey) ?? 0) + log.minutes
        );
      }
    }

    const series = Array.from(months.entries()).map(([month, value]) => ({
      month,
      averageHours: this.round(value.minutes / 60 / value.weeks),
      weeks: this.listWeeks(
        DateTime.fromFormat(`${month}-01`, 'yyyy-MM-dd', { zone: 'utc' }).toJSDate(),
        DateTime.fromFormat(month, 'yyyy-MM', { zone: 'utc' })
          .plus({ months: 1 })
          .startOf('month')
          .toJSDate()
      ).map((week) => {
        const weekKey = this.weekKey(week);
        return {
          week: weekKey,
          averageHours: this.round(
            (value.weeklyMinutes.get(weekKey) ?? 0) / 60
          )
        };
      })
    }));
    const totalAverageHours = series.reduce(
      (total, item) => total + item.averageHours,
      0
    );

    return {
      memberId: member.memberId,
      user: member.user,
      months: series,
      averageHoursPerMonth: series.length === 0
        ? 0
        : this.round(totalAverageHours / series.length),
      averageHoursPerTask: member.tasks.length === 0
        ? 0
        : this.round(
          member.tasks.reduce(
            (total, task) => total + task.spentMinutes,
            0
          ) / 60 / member.tasks.length
        )
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
    referenceAt: Date
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
    const deadline = DateTime.fromJSDate(data.deadline);
    const reference = DateTime.fromJSDate(referenceAt);
    const started = DateTime.fromJSDate(data.startedAt ?? referenceAt);
    const overdue = deadline.toMillis() < reference.toMillis()
      && openTasks > 0;
    const totalDuration = Math.max(
      deadline.diff(started).toMillis(),
      DAY_IN_MS
    );
    const elapsed = Math.max(
      reference.diff(started).toMillis(),
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
      ? reference.plus({ milliseconds: (openTasks / completedPerDay) * DAY_IN_MS }).toJSDate()
      : null;
    const projectedLate = projectedDeliveryAt
      ? DateTime.fromJSDate(projectedDeliveryAt).toMillis() > deadline.toMillis()
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

  private resolveMonth(month?: string | Date): StatsPeriod {
    const currentMonth = DateTime.now().toUTC().startOf('month');

    const value = month instanceof Date
      ? this.monthKey(month)
      : month ?? currentMonth.toFormat('yyyy-MM');

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new ValidationException('month deve estar no formato YYYY-MM.');
    }

    const [year, monthNumber] = value.split('-').map(Number);

    const start = DateTime.utc(year, monthNumber, 1).startOf('month');

    if (start.toMillis() > currentMonth.toMillis()) {
      throw new InvalidPeriodTime();
    }

    return {
      start: start.toJSDate(),
      end: start.plus({ months: 1 }).toJSDate()
    };
  }

  private assertPeriodNotBeforeProjectCreation(
    period: StatsPeriod,
    projectCreatedAt: Date
  ): void {
    if (DateTime.fromJSDate(period.end).toMillis() <= DateTime.fromJSDate(projectCreatedAt).toMillis()) {
      throw new InvalidPeriodTime();
    }
  }

  private lifecycleMinutesInPeriod(
    task: StatsTaskRecord,
    period: StatsPeriod | null,
    periodEnd: Date
  ): number {
    if (!task.started_at) {
      return 0;
    }

    const end = task.done_at && DateTime.fromJSDate(task.done_at).toMillis() < DateTime.fromJSDate(periodEnd).toMillis()
      ? task.done_at
      : periodEnd;
    const start = period && DateTime.fromJSDate(task.started_at).toMillis() < DateTime.fromJSDate(period.start).toMillis()
      ? period.start
      : task.started_at;
    const limitedEnd = period && DateTime.fromJSDate(end).toMillis() > DateTime.fromJSDate(period.end).toMillis()
      ? period.end
      : end;

    return this.elapsedMinutes(start, limitedEnd);
  }

  private elapsedMinutes(start: Date, end: Date): number {
    return Math.max(
      Math.floor(DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start)).as('minutes')),
      0
    );
  }

  private isTaskDelayed(task: StatsTaskRecord): boolean {
    return task.delayed;
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

  private async collectProjectStats(
    projectkey: string,
    period: StatsPeriod
  ): Promise<{
    stats: ProjectStats;
    memberTaskDetailsByMemberId: Map<string, StatsTaskDetails[]>;
  }> {
    const project = await this.queries.findProject(projectkey);

    if (!project) {
      throw new ProjectNotFoundException();
    }

    this.assertPeriodNotBeforeProjectCreation(period, project.created_at);

    const logs = await this.workLogs.list(
      {
        projectkey,
        logged_at: {
          gte: period.start,
          lt: period.end
        }
      },
      {
        logged_at: "asc"
      }
    );

    const tasks = project.tasks as StatsTaskRecord[];

    console.log(tasks);
    

    const delayedTasks = tasks.filter((task) =>
      this.isTaskDelayed(task)
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
    const performancePeriod = period;
    const members = project.members.map((member) => {
      const memberTasks = tasks.filter((task) =>
        task.ownerkey === member.id
      );

      return {
        member: member,
        stats: this.buildMemberStats(
          member,
          memberTasks,
          logsByTask,
          period.end,
          period
        ),
        taskDetails: this.buildMemberTaskDetails(
          memberTasks,
          logsByTask,
          period.end,
          period
        )
      };
    });
    const memberTaskDetailsByMemberId = new Map(
      members.map((member) => [
        member.stats.memberId,
        member.taskDetails
      ] as const)
    );
    const memberStats = members.map((member) => member.stats);
    const health = this.calculateHealth(
      {
        deadline: project.deadline,
        startedAt: project.started_at,
        totalTasks: tasks.length,
        doneTasks: doneTasks.length,
        delayedTasks: delayedTasks.length,
        progress
      },
      period.end
    );

    return {
      stats: {
        generatedAt: DateTime.now().toJSDate(),
        month: this.monthKey(period.start),
        period,
        project: {
          id: project.id,
          title: project.title,
          stage: project.stage,
          startedAt: project.started_at,
          doneAt: project.done_at,
          deadline: project.deadline,
          organization: project.org.name,
          manager: project.manager?.user.name ?? null,
          delayed: (
            project.delayed
          ) || (
            project.done_at === null
            && DateTime.fromJSDate(project.deadline).toMillis() < DateTime.fromJSDate(period.end).toMillis()
          ) || (
            project.done_at !== null
            && DateTime.fromJSDate(project.done_at).toMillis() > DateTime.fromJSDate(project.deadline).toMillis()
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
          daysLeft: this.daysBetween(DateTime.now().toJSDate(), project.deadline)
        },
        health,
        performancePerMember: memberStats.map((member) =>
          this.buildPerformance(member, logs, performancePeriod)
        ),
        productivity: memberStats.map((member) => ({
          memberId: member.memberId,
          completed: member.completedTasks,
          delayed: member.delayedTasks,
          ratio: this.round(
            member.completedTasks / Math.max(member.delayedTasks, 1)
          )
        })),
        members: memberStats,
        events: project.events
          .filter((event) => event.date >= period.start && event.date < period.end)
          .map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          category: event.category
          }))
      },
      memberTaskDetailsByMemberId
    };
  }

  private listMonths(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    let cursor = DateTime.fromJSDate(start, { zone: 'utc' }).startOf('month');

    while (cursor.toMillis() < DateTime.fromJSDate(end).toMillis()) {
      months.push(cursor.toJSDate());
      cursor = cursor.plus({ months: 1 });
    }

    return months;
  }

  private listWeeks(start: Date, end: Date): Date[] {
    const weeks: Date[] = [];
    let cursor = DateTime.fromJSDate(this.startOfIsoWeek(start), { zone: 'utc' });

    while (cursor.toMillis() < DateTime.fromJSDate(end).toMillis()) {
      weeks.push(cursor.toJSDate());
      cursor = cursor.plus({ weeks: 1 });
    }

    return weeks;
  }

  private startOfIsoWeek(date: Date): Date {
    return DateTime.fromJSDate(date, { zone: 'utc' })
      .startOf('day')
      .startOf('week')
      .toJSDate();
  }

  private monthKey(date: Date): string {
    return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyy-MM');
  }

  private weekKey(date: Date): string {
    return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyy-MM-dd');
  }

  private isInsidePeriod(value: Date | null, period: StatsPeriod): boolean {
    if (!value) {
      return false;
    }

    const timestamp = DateTime.fromJSDate(value).toMillis();
    return timestamp >= DateTime.fromJSDate(period.start).toMillis()
      && timestamp < DateTime.fromJSDate(period.end).toMillis();
  }

  private assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || !DateTime.fromJSDate(value).isValid) {
      throw new ValidationException(`${field} deve ser uma data válida.`);
    }
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private daysBetween(start: Date, end: Date): number {
    const difference = DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start), 'days').days;
    return difference >= 0
      ? Math.ceil(difference)
      : Math.floor(difference);
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
  }

  private reportFilename(title: string, monthStart: Date): string {
    const slug = title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "projeto";
    const date = DateTime.fromJSDate(monthStart, { zone: 'utc' }).toFormat('yyyy-MM');

    return `relatorio-desempenho-${slug}-${date}.pdf`;
  }
}
