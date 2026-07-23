-- DropForeignKey
ALTER TABLE "affiliations" DROP CONSTRAINT "affiliations_orgkey_fkey";
ALTER TABLE "affiliations" DROP CONSTRAINT "affiliations_userkey_fkey";
ALTER TABLE "comments" DROP CONSTRAINT "comments_ownerkey_fkey";
ALTER TABLE "images" DROP CONSTRAINT "images_userkey_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_actorkey_fkey";
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_ownerkey_fkey";
ALTER TABLE "projects" DROP CONSTRAINT "projects_managerkey_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_ownerkey_fkey";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "ownerkey" DROP NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "actorkey" DROP NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "ownerkey" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerkey_fkey"
  FOREIGN KEY ("ownerkey") REFERENCES "users"("username")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_orgkey_fkey"
  FOREIGN KEY ("orgkey") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_userkey_fkey"
  FOREIGN KEY ("userkey") REFERENCES "users"("username")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "images" ADD CONSTRAINT "images_userkey_fkey"
  FOREIGN KEY ("userkey") REFERENCES "users"("username")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerkey_fkey"
  FOREIGN KEY ("managerkey") REFERENCES "affiliations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ownerkey_fkey"
  FOREIGN KEY ("ownerkey") REFERENCES "member"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_ownerkey_fkey"
  FOREIGN KEY ("ownerkey") REFERENCES "users"("username")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorkey_fkey"
  FOREIGN KEY ("actorkey") REFERENCES "users"("username")
  ON DELETE SET NULL ON UPDATE CASCADE;
