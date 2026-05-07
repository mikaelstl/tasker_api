/*
  Warnings:

  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "managerkey" TEXT;

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerkey_fkey" FOREIGN KEY ("managerkey") REFERENCES "affiliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
