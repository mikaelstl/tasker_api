/*
  Warnings:

  - A unique constraint covering the columns `[userkey,orgkey]` on the table `Affiliations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Affiliations_userkey_orgkey_key" ON "Affiliations"("userkey", "orgkey");
