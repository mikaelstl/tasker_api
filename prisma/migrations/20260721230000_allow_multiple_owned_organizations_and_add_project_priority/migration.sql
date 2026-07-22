-- A user can own multiple organizations.
DROP INDEX IF EXISTS "organizations_ownerkey_key";

-- Projects expose the same range of priorities used by tasks.
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

ALTER TABLE "projects"
ADD COLUMN "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM';
