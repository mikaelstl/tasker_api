-- Normalize existing task rows before removing the enum value.
UPDATE "tasks"
SET "stage" = 'STARTED'
WHERE "stage" = 'IN_PROGRESS';

CREATE TYPE "TaskStage_new" AS ENUM ('STARTED', 'PENDING', 'REVIEW', 'DONE');

ALTER TABLE "public"."tasks" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "stage" TYPE "TaskStage_new" USING ("stage"::text::"TaskStage_new");
ALTER TABLE "tasks" ALTER COLUMN "stage" SET DEFAULT 'PENDING';

DROP TYPE "TaskStage";
ALTER TYPE "TaskStage_new" RENAME TO "TaskStage";
