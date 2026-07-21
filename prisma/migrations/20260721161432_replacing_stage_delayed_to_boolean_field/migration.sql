/*
  Warnings:

  - The values [DELAYED] on the enum `ProjectStage` will be removed. If these variants are still used in the database, this will fail.
  - The values [DELAYED] on the enum `TaskStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStage_new" AS ENUM ('STARTED', 'PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED');
ALTER TABLE "public"."projects" ALTER COLUMN "progress" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "progress" TYPE "ProjectStage_new" USING ("progress"::text::"ProjectStage_new");
ALTER TYPE "ProjectStage" RENAME TO "ProjectStage_old";
ALTER TYPE "ProjectStage_new" RENAME TO "ProjectStage";
DROP TYPE "public"."ProjectStage_old";
ALTER TABLE "projects" ALTER COLUMN "progress" SET DEFAULT 'STARTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStage_new" AS ENUM ('STARTED', 'PENDING', 'IN_PROGRESS', 'REVIEW', 'DONE');
ALTER TABLE "public"."tasks" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "stage" TYPE "TaskStage_new" USING ("stage"::text::"TaskStage_new");
ALTER TYPE "TaskStage" RENAME TO "TaskStage_old";
ALTER TYPE "TaskStage_new" RENAME TO "TaskStage";
DROP TYPE "public"."TaskStage_old";
ALTER TABLE "tasks" ALTER COLUMN "stage" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "delayed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "delayed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "projects_delayed_due_date_progress_idx" ON "projects"("delayed", "due_date", "progress");

-- CreateIndex
CREATE INDEX "tasks_delayed_due_date_stage_idx" ON "tasks"("delayed", "due_date", "stage");
