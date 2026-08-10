import { ProjectStage, TaskStage } from "generated/prisma";
import { StatsService } from "./stats.service";

describe("StatsService member performance", () => {
  it("rejects months before the project creation month", async () => {
    const queries = {
      findProject: jest.fn().mockResolvedValue({
        created_at: new Date("2026-06-15T12:00:00.000Z")
      })
    };
    const service = new StatsService(
      queries as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(
      service.getProjectStats("project-1", "2026-05")
    ).rejects.toThrow("Período inválido");
  });

  it("uses project months on the X axis and averages member hours per month", async () => {
    const queries = {
      findProject: jest.fn().mockResolvedValue({
        id: "project-1",
        title: "Tasker",
        created_at: new Date("2026-05-01T00:00:00.000Z"),
        stage: ProjectStage.IN_PROGRESS,
        started_at: new Date("2026-05-01T00:00:00.000Z"),
        done_at: null,
        delayed: false,
        deadline: new Date("2026-09-01T00:00:00.000Z"),
        org: {
          name: "Horizon Systems"
        },
        manager: null,
        events: [],
        tasks: [],
        members: [{
          id: "member-1",
          user: {
            id: "affiliation-1",
            user: {
              username: "mikael",
              name: "Mikael Alves",
              photo: null
            }
          }
        }]
      })
    };
    const workLogs = {
      list: jest.fn().mockResolvedValue([
        {
          taskkey: "task-1",
          memberkey: "member-1",
          minutes: 600,
          logged_at: new Date("2026-05-15T12:00:00.000Z")
        },
        {
          taskkey: "task-1",
          memberkey: "member-1",
          minutes: 300,
          logged_at: new Date("2026-06-15T12:00:00.000Z")
        },
        {
          taskkey: "task-1",
          memberkey: "member-1",
          minutes: 240,
          logged_at: new Date("2026-07-15T12:00:00.000Z")
        }
      ])
    };
    const service = new StatsService(
      queries as any,
      workLogs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    const stats = await service.getProjectStats("project-1", "2026-07");

    expect(stats.performancePerMember[0]).toMatchObject({
      memberId: "member-1",
      months: [
        {
          month: "2026-07",
          averageHours: 0.8,
          weeks: [
            { week: "2026-06-29", averageHours: 0 },
            { week: "2026-07-06", averageHours: 0 },
            { week: "2026-07-13", averageHours: 4 },
            { week: "2026-07-20", averageHours: 0 },
            { week: "2026-07-27", averageHours: 0 }
          ]
        }
      ],
      averageHoursPerMonth: 0.8,
      averageHoursPerTask: 0,
    });
    expect(stats.performancePerMember[0].user.affiliationId)
      .toBe("affiliation-1");
    expect(stats.members[0].tasks).toEqual([]);
    expect(stats.project.stage).toBe(ProjectStage.IN_PROGRESS);
  });

  it("returns task delivery and worked-time metrics for every project member", async () => {
    const queries = {
      findProject: jest.fn().mockResolvedValue({
        id: "project-1",
        title: "Tasker",
        created_at: new Date("2026-07-01T00:00:00.000Z"),
        stage: ProjectStage.IN_PROGRESS,
        started_at: new Date("2026-07-01T00:00:00.000Z"),
        done_at: null,
        delayed: false,
        deadline: new Date("2026-08-01T00:00:00.000Z"),
        org: {
          name: "Horizon Systems"
        },
        manager: null,
        events: [],
        tasks: [
          {
            id: "task-1",
            code: "TSK-001",
            name: "Concluída",
            stage: TaskStage.DONE,
            delayed: false,
            deadline: new Date("2026-07-10T00:00:00.000Z"),
            ownerkey: "member-1",
            started_at: new Date("2026-07-01T00:00:00.000Z"),
            done_at: new Date("2026-07-05T00:00:00.000Z")
          },
          {
            id: "task-2",
            code: "TSK-002",
            name: "Atrasada",
            stage: TaskStage.STARTED,
            delayed: false,
            deadline: new Date("2026-07-10T00:00:00.000Z"),
            ownerkey: "member-1",
            started_at: new Date("2026-07-08T00:00:00.000Z"),
            done_at: null
          }
        ],
        members: [{
          id: "member-1",
          user: {
            id: "affiliation-1",
            user: {
              username: "mikaelst",
              name: "Mikael",
              photo: null
            }
          }
        }]
      })
    };
    const workLogs = {
      list: jest.fn().mockResolvedValue([
        {
          taskkey: "task-1",
          memberkey: "member-1",
          minutes: 120,
          logged_at: new Date("2026-07-05T00:00:00.000Z")
        },
        {
          taskkey: "task-2",
          memberkey: "member-1",
          minutes: 60,
          logged_at: new Date("2026-07-15T00:00:00.000Z")
        }
      ])
    };
    const service = new StatsService(
      queries as any,
      workLogs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    const performance = await service.getProjectMemberPerformance(
      "project-1",
      new Date("2026-07-20T23:59:59.000Z")
    );

    expect(performance.project).toEqual({
      id: "project-1",
      title: "Tasker"
    });
    expect(performance.members[0]).toMatchObject({
      memberId: "member-1",
      totalTasks: 2,
      completedTasks: 1,
      completionRate: 50,
      delayedTasks: 0,
      delayRate: 0,
      startedTasks: 1,
      reviewTasks: 0,
      spentMinutes: 180,
      spentHours: 3,
      averageHoursPerTask: 1.5,
      weeks: [
        { week: "2026-06-29", averageHours: 2 },
        { week: "2026-07-06", averageHours: 0 },
        { week: "2026-07-13", averageHours: 1 },
        { week: "2026-07-20", averageHours: 0 },
        { week: "2026-07-27", averageHours: 0 }
      ]
    });
  });
});
