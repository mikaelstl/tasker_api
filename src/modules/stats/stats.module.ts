import { Module } from "@nestjs/common";
import { ProjectStatsPeriodSnapshotsRepository } from "./repositories/project-stats-period-snapshots.repository";
import { ProjectStatsPeriodTasksRepository } from "./repositories/project-stats-period-tasks.repository";
import { ProjectStatsQueryRepository } from "./repositories/project-stats-query.repository";
import { ProjectStatsReportsRepository } from "./repositories/project-stats-reports.repository";
import { TaskWorkLogsRepository } from "./repositories/task-work-logs.repository";
import { ProjectStatsReportDocument } from "./project-stats-report.document";
import { StatsService } from "./stats.service";

const repositories = [
  ProjectStatsQueryRepository,
  TaskWorkLogsRepository,
  ProjectStatsPeriodSnapshotsRepository,
  ProjectStatsPeriodTasksRepository,
  ProjectStatsReportsRepository,
];

@Module({
  providers: [
    ...repositories,
    ProjectStatsReportDocument,
    StatsService,
  ],
  exports: [
    StatsService,
  ],
})
export class StatsModule { }
