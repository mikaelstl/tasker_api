/*
  Warnings:

  - The `progress` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('STARTED', 'PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "StatsPeriodType" AS ENUM ('WEEK', 'MONTH', 'QUARTER');

-- CreateEnum
CREATE TYPE "ProjectHealthStatus" AS ENUM ('SAFE', 'WARNING', 'CRITICAL');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "done_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3),
DROP COLUMN "progress",
ADD COLUMN     "progress" "ProjectStage" NOT NULL DEFAULT 'STARTED';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "done_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3);

-- DropEnum
DROP TYPE "public"."ProjectProgress";

-- CreateTable
CREATE TABLE "task_work_logs" (
    "id" TEXT NOT NULL,
    "projectkey" TEXT NOT NULL,
    "taskkey" TEXT NOT NULL,
    "memberkey" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stats_period_snapshots" (
    "id" TEXT NOT NULL,
    "projectkey" TEXT NOT NULL,
    "period_type" "StatsPeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cutoff_at" TIMESTAMP(3) NOT NULL,
    "performance_per_member_json" JSONB NOT NULL,
    "productivity_json" JSONB NOT NULL,
    "summary_json" JSONB NOT NULL,
    "health_status" "ProjectHealthStatus" NOT NULL,
    "health_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_stats_period_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stats_period_tasks" (
    "id" TEXT NOT NULL,
    "snapshotkey" TEXT NOT NULL,
    "taskkey" TEXT NOT NULL,
    "memberkey" TEXT NOT NULL,
    "spent_minutes" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3),
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_stats_period_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stats_reports" (
    "id" TEXT NOT NULL,
    "projectkey" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cutoff_at" TIMESTAMP(3) NOT NULL,
    "period_type" "StatsPeriodType" NOT NULL,
    "snapshotkey" TEXT,
    "file_url" TEXT,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_stats_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_work_logs_projectkey_logged_at_idx" ON "task_work_logs"("projectkey", "logged_at");

-- CreateIndex
CREATE INDEX "task_work_logs_taskkey_logged_at_idx" ON "task_work_logs"("taskkey", "logged_at");

-- CreateIndex
CREATE INDEX "task_work_logs_memberkey_logged_at_idx" ON "task_work_logs"("memberkey", "logged_at");

-- CreateIndex
CREATE INDEX "project_stats_period_snapshots_projectkey_period_type_perio_idx" ON "project_stats_period_snapshots"("projectkey", "period_type", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "project_stats_period_snapshots_projectkey_period_type_perio_key" ON "project_stats_period_snapshots"("projectkey", "period_type", "period_start", "cutoff_at");

-- CreateIndex
CREATE INDEX "project_stats_period_tasks_snapshotkey_idx" ON "project_stats_period_tasks"("snapshotkey");

-- CreateIndex
CREATE INDEX "project_stats_period_tasks_taskkey_idx" ON "project_stats_period_tasks"("taskkey");

-- CreateIndex
CREATE INDEX "project_stats_period_tasks_memberkey_idx" ON "project_stats_period_tasks"("memberkey");

-- CreateIndex
CREATE UNIQUE INDEX "project_stats_period_tasks_snapshotkey_taskkey_memberkey_key" ON "project_stats_period_tasks"("snapshotkey", "taskkey", "memberkey");

-- CreateIndex
CREATE INDEX "project_stats_reports_projectkey_generated_at_idx" ON "project_stats_reports"("projectkey", "generated_at");

-- CreateIndex
CREATE INDEX "project_stats_reports_projectkey_cutoff_at_idx" ON "project_stats_reports"("projectkey", "cutoff_at");

-- AddForeignKey
ALTER TABLE "task_work_logs" ADD CONSTRAINT "task_work_logs_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_work_logs" ADD CONSTRAINT "task_work_logs_taskkey_fkey" FOREIGN KEY ("taskkey") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_work_logs" ADD CONSTRAINT "task_work_logs_memberkey_fkey" FOREIGN KEY ("memberkey") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_period_snapshots" ADD CONSTRAINT "project_stats_period_snapshots_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_period_tasks" ADD CONSTRAINT "project_stats_period_tasks_snapshotkey_fkey" FOREIGN KEY ("snapshotkey") REFERENCES "project_stats_period_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_period_tasks" ADD CONSTRAINT "project_stats_period_tasks_taskkey_fkey" FOREIGN KEY ("taskkey") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_period_tasks" ADD CONSTRAINT "project_stats_period_tasks_memberkey_fkey" FOREIGN KEY ("memberkey") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_reports" ADD CONSTRAINT "project_stats_reports_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stats_reports" ADD CONSTRAINT "project_stats_reports_snapshotkey_fkey" FOREIGN KEY ("snapshotkey") REFERENCES "project_stats_period_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
