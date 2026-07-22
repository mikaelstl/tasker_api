-- Preserve the audit trail when its organization is deleted.
ALTER TABLE "audit_logs"
  DROP CONSTRAINT "audit_logs_orgkey_fkey";

ALTER TABLE "audit_logs"
  ALTER COLUMN "orgkey" DROP NOT NULL;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_orgkey_fkey"
  FOREIGN KEY ("orgkey") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
