-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_orgkey_fkey";

-- AlterTable
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Events" ADD CONSTRAINT "Events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Organizations" ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "public"."Organizations_id_key" CASCADE;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "orgkey" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_orgkey_fkey" FOREIGN KEY ("orgkey") REFERENCES "Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
