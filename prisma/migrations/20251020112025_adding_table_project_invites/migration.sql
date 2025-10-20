-- CreateTable
CREATE TABLE "ProjectInvites" (
    "id" TEXT NOT NULL,
    "pending" BOOLEAN NOT NULL DEFAULT true,
    "projectkey" TEXT NOT NULL,
    "senderkey" TEXT NOT NULL,
    "receiverkey" TEXT NOT NULL,

    CONSTRAINT "ProjectInvites_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectInvites" ADD CONSTRAINT "ProjectInvites_projectkey_fkey" FOREIGN KEY ("projectkey") REFERENCES "Projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvites" ADD CONSTRAINT "ProjectInvites_senderkey_fkey" FOREIGN KEY ("senderkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvites" ADD CONSTRAINT "ProjectInvites_receiverkey_fkey" FOREIGN KEY ("receiverkey") REFERENCES "Users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
