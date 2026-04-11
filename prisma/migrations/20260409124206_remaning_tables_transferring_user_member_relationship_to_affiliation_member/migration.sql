/*
  Warnings:

  - You are about to drop the `Accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Affiliations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Affiliations" DROP CONSTRAINT "Affiliations_orgkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Affiliations" DROP CONSTRAINT "Affiliations_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comments" DROP CONSTRAINT "Comments_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comments" DROP CONSTRAINT "Comments_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Events" DROP CONSTRAINT "Events_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Images" DROP CONSTRAINT "Images_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Member" DROP CONSTRAINT "Member_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Member" DROP CONSTRAINT "Member_userkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notifications" DROP CONSTRAINT "Notifications_actorkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Organizations" DROP CONSTRAINT "Organizations_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Projects" DROP CONSTRAINT "Projects_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_ownerkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_projectkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_accountkey_fkey";

-- DropTable
DROP TABLE "public"."Accounts";

-- DropTable
DROP TABLE "public"."Affiliations";

-- DropTable
DROP TABLE "public"."Comments";

-- DropTable
DROP TABLE "public"."Events";

-- DropTable
DROP TABLE "public"."Images";

-- DropTable
DROP TABLE "public"."Member";

-- DropTable
DROP TABLE "public"."Notifications";

-- DropTable
DROP TABLE "public"."Organizations";

-- DropTable
DROP TABLE "public"."Projects";

-- DropTable
DROP TABLE "public"."Tasks";

-- DropTable
DROP TABLE "public"."Users";

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliations" (
    "id" TEXT NOT NULL,
    "orgkey" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "progress" "ProjectProgress" NOT NULL DEFAULT 'STARTED',
    "ownerkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "projectkey" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "stage" "TaskStage" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL,
    "projectkey" TEXT NOT NULL,
    "ownerkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerkey" TEXT NOT NULL,
    "projectkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectkey" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_accountkey_key" ON "users"("accountkey");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ownerkey_key" ON "organizations"("ownerkey");

-- CreateIndex
CREATE UNIQUE INDEX "affiliations_userkey_orgkey_key" ON "affiliations"("userkey", "orgkey");

-- CreateIndex
CREATE UNIQUE INDEX "images_userkey_key" ON "images"("userkey");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_key" ON "tasks"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_code_key" ON "tasks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_key" ON "events"("id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accountkey_fkey" FOREIGN KEY ("accountkey") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "affiliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorkey_fkey" FOREIGN KEY ("actorkey") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
