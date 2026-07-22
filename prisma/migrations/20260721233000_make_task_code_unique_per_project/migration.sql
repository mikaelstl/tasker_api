-- Task codes may be reused by different projects, but never inside the same one.
DROP INDEX IF EXISTS "tasks_code_key";

CREATE UNIQUE INDEX "tasks_projectkey_code_key"
ON "tasks"("projectkey", "code");
