import {
  ProjectHealthStatus,
  StatsPeriodType,
  TaskStage
} from "generated/prisma";

export type StatsPeriod = {
  start: Date;
  end: Date;
};

export type StatsUser = {
  username: string;
  name: string;
  photoUrl: string | null;
};

export type StatsTask = {
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

export type MemberPerformance = {
  memberId: string;
  user: StatsUser;
  months: Array<{
    month: string;
    averageHours: number;
  }>;
  averageHoursPerMonth: number;
};

export type MemberProductivity = {
  memberId: string;
  completed: number;
  delayed: number;
  ratio: number;
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
  cutoffAt: Date;
  period: StatsPeriod | null;
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
  periodType: StatsPeriodType;
  cutoffAt?: Date;
};

export type GenerateReportInput = {
  projectkey: string;
  periodType: StatsPeriodType;
  cutoffAt?: Date;
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
  deadline: Date;
  ownerkey: string;
  started_at: Date | null;
  done_at: Date | null;
};
