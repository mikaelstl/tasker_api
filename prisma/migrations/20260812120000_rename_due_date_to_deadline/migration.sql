-- RenameColumn
ALTER TABLE "projects" RENAME COLUMN "due_date" TO "deadline";
ALTER TABLE "tasks" RENAME COLUMN "due_date" TO "deadline";

-- RenameIndex
ALTER INDEX "projects_delayed_due_date_progress_idx" RENAME TO "projects_delayed_deadline_progress_idx";
ALTER INDEX "tasks_delayed_due_date_stage_idx" RENAME TO "tasks_delayed_deadline_stage_idx";
