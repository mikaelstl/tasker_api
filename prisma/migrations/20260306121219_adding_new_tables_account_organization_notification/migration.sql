/*
  Warnings:

  - You are about to drop the column `email` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `enterprise` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `Members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectInvites` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orgkey` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('ORGANIZER', 'MANAGER', 'COMMON');

-- DropForeignKey
ALTER TABLE "public"."Members" DROP CONSTRAINT "Members_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Members" DROP CONSTRAINT "Members_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectInvites" DROP CONSTRAINT "ProjectInvites_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectInvites" DROP CONSTRAINT "ProjectInvites_receiverkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectInvites" DROP CONSTRAINT "ProjectInvites_senderkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Projects" DROP CONSTRAINT "Projects_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_ownerkey_fkey";

-- DropIndex
DROP INDEX "public"."Users_email_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "email",
DROP COLUMN "enterprise",
DROP COLUMN "password",
ADD COLUMN     "orgkey" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Members";

-- DropTable
DROP TABLE "public"."ProjectInvites";

-- CreateTable
CREATE TABLE "Accounts" (
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'COMMON',
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enterprise" BOOLEAN NOT NULL DEFAULT false,
    "ownerkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "projectkey" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_email_key" ON "Accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_userkey_key" ON "Accounts"("userkey");

-- CreateIndex
CREATE UNIQUE INDEX "Organizations_id_key" ON "Organizations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Organizations_ownerkey_key" ON "Organizations"("ownerkey");

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "Organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizations" ADD CONSTRAINT "Organizations_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "Organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_actorkey_fkey" FOREIGN KEY ("actorkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
