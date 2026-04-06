/*
  Warnings:

  - You are about to drop the column `role` on the `Accounts` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `orgkey` on the `Users` table. All the data in the column will be lost.
  - Added the required column `category` to the `Events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RELEASE', 'MEETING', 'REVIEW', 'PLANNING', 'TESTS', 'LAUNCH');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORGANIZER', 'MANAGER', 'MEMBER');

-- DropForeignKey
ALTER TABLE "public"."Member" DROP CONSTRAINT "Member_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Member" DROP CONSTRAINT "Member_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_accountkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_orgkey_fkey";

-- AlterTable
ALTER TABLE "Accounts" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "category" "EventCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "orgkey";

-- DropEnum
DROP TYPE "public"."AccountRole";

-- DropEnum
DROP TYPE "public"."MemberRole";

-- CreateTable
CREATE TABLE "Affiliations" (
    "id" TEXT NOT NULL,
    "orgkey" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_accountkey_fkey" FOREIGN KEY ("accountkey") REFERENCES "Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliations" ADD CONSTRAINT "Affiliations_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "Organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliations" ADD CONSTRAINT "Affiliations_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
