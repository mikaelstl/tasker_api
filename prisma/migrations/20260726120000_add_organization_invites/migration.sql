CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "orgkey" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invites_token_hash_key"
ON "organization_invites"("token_hash");

CREATE INDEX "organization_invites_orgkey_created_at_idx"
ON "organization_invites"("orgkey", "created_at");

CREATE INDEX "organization_invites_expires_at_idx"
ON "organization_invites"("expires_at");

ALTER TABLE "organization_invites"
ADD CONSTRAINT "organization_invites_orgkey_fkey"
FOREIGN KEY ("orgkey") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
