/*
  Warnings:

  - You are about to drop the `Checkpoints` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Checkpoints" DROP CONSTRAINT "Checkpoints_projectkey_fkey";

-- DropTable
DROP TABLE "public"."Checkpoints";

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectkey" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Events_id_key" ON "Events"("id");

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
