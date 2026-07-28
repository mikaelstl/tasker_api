import {
  ProjectHealthStatus,
  StatsPeriodType,
  TaskStage
} from "generated/prisma";
import { ProjectStatsReportDocument } from "./project-stats-report.document";

describe("ProjectStatsReportDocument", () => {
  it("describes delayed tasks according to their workflow stage", () => {
    const report = new ProjectStatsReportDocument() as any;

    expect(report.taskStatus(TaskStage.DONE, true))
      .toBe("CONCLUÍDA EM ATRASO");
    expect(report.taskDelayNotice("TSK-DONE", TaskStage.DONE))
      .toBe("Tarefa com código TSK-DONE foi concluída em atraso.");
    expect(report.taskStatus(TaskStage.PENDING, true))
      .toBe("PENDENTE EM ATRASO");
    expect(report.taskDelayNotice("TSK-PENDING", TaskStage.PENDING))
      .toBe("Tarefa com código TSK-PENDING está pendente em atraso.");
  });

  it("generates a downloadable PDF using the project statistics", async () => {
    const cutoffAt = new Date("2026-07-20T13:00:00.000Z");
    const stats: any = {
      generatedAt: cutoffAt,
      cutoffAt,
      period: null,
      project: {
        id: "PRJ-001",
        title: "Tasker",
        stage: "STARTED",
        startedAt: new Date("2026-05-01T00:00:00.000Z"),
        doneAt: null,
        deadline: new Date("2026-08-31T00:00:00.000Z"),
        delayed: false,
        organization: "Horizon Systems",
        manager: "Mikael Alves"
      },
      summary: {
        totalTasks: 2,
        doneTasks: 1,
        openTasks: 1,
        startedTasks: 1,
        reviewTasks: 0,
        delayedTasks: 0,
        progress: 50
      },
      deadline: {
        dueDate: new Date("2026-08-31T00:00:00.000Z"),
        daysLeft: 42
      },
      health: {
        status: ProjectHealthStatus.SAFE,
        score: 82,
        reason: "O ritmo atual indica entrega dentro do prazo.",
        projectedDeliveryAt: new Date("2026-08-20T00:00:00.000Z")
      },
      performancePerMember: [{
        memberId: "member-1",
        user: {
          username: "mikael",
          name: "Mikael Alves",
          photoUrl: null
        },
        months: [
          { month: "2026-05", averageHours: 12 },
          { month: "2026-06", averageHours: 18 },
          { month: "2026-07", averageHours: 20 }
        ],
        averageHoursPerMonth: 16.67
      }],
      productivity: [{
        memberId: "member-1",
        completed: 1,
        delayed: 0,
        ratio: 1
      }],
      members: [{
        memberId: "member-1",
        user: {
          username: "mikael",
          name: "Mikael Alves",
          photoUrl: null
        },
        completedTasks: 1,
        delayedTasks: 0,
        startedTasks: 1,
        reviewTasks: 0,
        tasks: [{
          id: "task-1",
          code: "TSK-001",
          name: "Gerar relatório",
          stage: TaskStage.STARTED,
          delayed: false,
          spentMinutes: 120,
          deadline: new Date("2026-07-24T00:00:00.000Z"),
          startedAt: new Date("2026-07-20T10:00:00.000Z"),
          doneAt: null
        }]
      }],
      events: [{
        id: "event-1",
        title: "Entrega do relatório",
        date: new Date("2026-07-24T16:00:00.000Z"),
        category: "RELEASE"
      }]
    };
    const document = await new ProjectStatsReportDocument().generate({
      reportId: "report-1",
      periodType: StatsPeriodType.WEEK,
      stats,
      historicalSnapshots: []
    });
    expect(document.subarray(0, 5).toString()).toBe("%PDF-");
    expect(document.length).toBeGreaterThan(10_000);
  });
});
