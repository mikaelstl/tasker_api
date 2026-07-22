/*
  Warnings:

  - You are about to drop the column `ownerkey` on the `projects` table. All the data in the column will be lost.
  - Added the required column `orgkey` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_ownerkey_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "ownerkey",
ADD COLUMN     "orgkey" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
