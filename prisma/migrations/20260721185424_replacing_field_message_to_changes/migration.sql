/*
  Warnings:

  - You are about to drop the column `message` on the `audit_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "message",
ADD COLUMN     "changes" JSONB NOT NULL DEFAULT '{}';
