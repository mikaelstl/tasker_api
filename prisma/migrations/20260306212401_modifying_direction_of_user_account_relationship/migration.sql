/*
  Warnings:

  - You are about to drop the column `userkey` on the `Accounts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountkey]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountkey` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Accounts" DROP CONSTRAINT "Accounts_userkey_fkey";

-- DropIndex
DROP INDEX "public"."Accounts_userkey_key";

-- AlterTable
ALTER TABLE "Accounts" DROP COLUMN "userkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "accountkey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_accountkey_key" ON "Users"("accountkey");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_accountkey_fkey" FOREIGN KEY ("accountkey") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_ownerkey_fkey" FOREIGN KEY ("ownerkey") REFERENCES "Organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
