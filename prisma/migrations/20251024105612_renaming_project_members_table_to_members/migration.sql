/*
  Warnings:

  - You are about to drop the `ProjectMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProjectMembers" DROP CONSTRAINT "ProjectMembers_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectMembers" DROP CONSTRAINT "ProjectMembers_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_ownerkey_fkey";

-- AlterTable
ALTER TABLE "ProjectInvites" ADD COLUMN     "accept" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "public"."ProjectMembers";

-- CreateTable
CREATE TABLE "Members" (
    "id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "projectkey" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "Members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
