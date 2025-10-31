/*
  Warnings:

  - You are about to drop the column `photo` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "photo";

-- CreateTable
CREATE TABLE "Images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Images_userkey_key" ON "Images"("userkey");

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_userkey_fkey" FOREIGN KEY ("userkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
