import { ProjectStage, TaskStage } from "generated/prisma";
import { DeadlinesService } from "./deadlines.service";

describe("DeadlinesService", () => {
  it("marks only overdue, open projects and tasks", async () => {
    const projectsUpdate = jest.fn().mockReturnValue("projects-update");
    const tasksUpdate = jest.fn().mockReturnValue("tasks-update");
    const prisma = {
      project: { updateMany: projectsUpdate },
      task: { updateMany: tasksUpdate },
      $transaction: jest.fn().mockResolvedValue([{ count: 2 }, { count: 4 }])
    };
    const service = new DeadlinesService(prisma as any);
    const now = new Date("2026-07-21T12:00:00.000Z");

    await expect(service.markOverdueEntities(now)).resolves.toEqual({
      projects: 2,
      tasks: 4
    });
    expect(projectsUpdate).toHaveBeenCalledWith({
      where: {
        delayed: false,
        deadline: { lt: now },
        stage: { not: ProjectStage.COMPLETED }
      },
      data: { delayed: true }
    });
    expect(tasksUpdate).toHaveBeenCalledWith({
      where: {
        delayed: false,
        deadline: { lt: now },
        stage: { not: TaskStage.DONE }
      },
      data: { delayed: true }
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      "projects-update",
      "tasks-update"
    ]);
  });
});
