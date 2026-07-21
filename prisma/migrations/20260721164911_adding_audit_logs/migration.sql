-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ADD', 'REMOVE', 'COMMENT', 'STATUS_CHANGE', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "AuditResource" AS ENUM ('ORGS', 'AFFILIATIONS', 'PROJECTS', 'MEMBERS', 'TASKS', 'COMMENTS', 'EVENTS', 'PROJECT_STATS');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "orgkey" TEXT NOT NULL,
    "actorkey" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" "AuditResource" NOT NULL,
    "resourcekey" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_orgkey_created_at_idx" ON "audit_logs"("orgkey", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actorkey_idx" ON "audit_logs"("actorkey");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourcekey_idx" ON "audit_logs"("resource", "resourcekey");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorkey_fkey" FOREIGN KEY ("actorkey") REFERENCES "users"("username") ON DELETE SET NULL ON UPDATE CASCADE;
