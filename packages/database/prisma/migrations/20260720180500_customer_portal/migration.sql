-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "portalEmail" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "lastPortalLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WhatsappBotConfig" ADD COLUMN "customerId" TEXT;

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_portalEmail_key" ON "Customer"("portalEmail");

-- CreateIndex
CREATE INDEX "WhatsappBotConfig_customerId_idx" ON "WhatsappBotConfig"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");

-- AddForeignKey
ALTER TABLE "WhatsappBotConfig" ADD CONSTRAINT "WhatsappBotConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
