import { ProjectHealthStatus, TaskStage } from "generated/prisma";

export type StatsPeriod = {
  start: Date;
  end: Date;
};

export type StatsUser = {
  affiliationId: string;
  username: string;
  name: string;
  photoUrl: string | null;
};

export type StatsTask = {
  code: string;
  name: string;
  stage: TaskStage;
  delayed: boolean;
  spentMinutes: number;
  deadline: Date;
};

export type MemberPerformance = {
  memberId: string;
  user: StatsUser;
  months: Array<{
    month: string;
    averageHours: number;
    weeks?: Array<{
      week: string;
      averageHours: number;
    }>;
  }>;
  averageHoursPerMonth: number;
  averageHoursPerTask?: number;
};

export type MemberProductivity = {
  memberId: string;
  completed: number;
  delayed: number;
  ratio: number;
};

export type ProjectMemberPerformance = {
  generatedAt: Date;
  month: string;
  project: {
    id: string;
    title: string;
  };
  members: Array<{
    memberId: string;
    user: StatsUser;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    delayedTasks: number;
    delayRate: number;
    startedTasks: number;
    reviewTasks: number;
    spentMinutes: number;
    spentHours: number;
    averageHoursPerMonth: number;
    averageHoursPerTask: number;
    months: MemberPerformance["months"];
    weeks: NonNullable<MemberPerformance["months"][number]["weeks"]>;
  }>;
};

export type MemberStats = {
  memberId: string;
  user: StatsUser;
  completedTasks: number;
  delayedTasks: number;
  startedTasks: number;
  reviewTasks: number;
  tasks: StatsTask[];
};

export type ProjectStats = {
  generatedAt: Date;
  month: string;
  period: StatsPeriod;
  project: {
    id: string;
    title: string;
    stage: string;
    startedAt: Date | null;
    doneAt: Date | null;
    deadline: Date;
    delayed: boolean;
    organization: string;
    manager: string | null;
  };
  summary: {
    totalTasks: number;
    doneTasks: number;
    openTasks: number;
    startedTasks: number;
    reviewTasks: number;
    delayedTasks: number;
    progress: number;
  };
  deadline: {
    dueDate: Date;
    daysLeft: number;
  };
  health: {
    status: ProjectHealthStatus;
    score: number;
    reason: string;
    projectedDeliveryAt: Date | null;
  };
  performancePerMember: MemberPerformance[];
  productivity: MemberProductivity[];
  members: MemberStats[];
  events: Array<{
    id: string;
    title: string;
    date: Date;
    category: string;
  }>;
};

export type RecordTaskWorkLogInput = {
  taskkey: string;
  memberkey: string;
  loggedAt?: Date;
  note?: string;
  source?: string;
};

export type GenerateSnapshotInput = {
  projectkey: string;
  month?: string;
};

export type GenerateReportInput = {
  projectkey: string;
  month?: string;
};

export type GeneratedProjectReport = {
  filename: string;
  document: Buffer;
};

export type StatsTaskRecord = {
  id: string;
  code: string;
  name: string;
  stage: TaskStage;
  delayed: boolean;
  deadline: Date;
  ownerkey: string | null;
  started_at: Date | null;
  done_at: Date | null;
};
