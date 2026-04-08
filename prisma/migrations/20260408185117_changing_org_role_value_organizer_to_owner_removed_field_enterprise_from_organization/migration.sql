/*
  Warnings:

  - The values [ORGANIZER] on the enum `OrgRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `enterprise` on the `Organizations` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrgRole_new" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');
ALTER TABLE "public"."Affiliations" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Affiliations" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TYPE "OrgRole" RENAME TO "OrgRole_old";
ALTER TYPE "OrgRole_new" RENAME TO "OrgRole";
DROP TYPE "public"."OrgRole_old";
ALTER TABLE "Affiliations" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "Organizations" DROP COLUMN "enterprise";
