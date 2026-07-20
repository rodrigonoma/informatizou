-- CreateTable
CREATE TABLE "PortalPasswordReset" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalPasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalPasswordReset_tokenHash_key" ON "PortalPasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PortalPasswordReset_customerId_idx" ON "PortalPasswordReset"("customerId");

-- AddForeignKey
ALTER TABLE "PortalPasswordReset" ADD CONSTRAINT "PortalPasswordReset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
