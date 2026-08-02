/*
  Warnings:

  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_actorkey_fkey";

-- DropTable
DROP TABLE "public"."notifications";

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
