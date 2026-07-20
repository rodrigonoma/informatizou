-- CreateEnum
CREATE TYPE "WhatsappMsgDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsappConvMode" AS ENUM ('BOT', 'HUMAN', 'CLOSED');

-- CreateTable
CREATE TABLE "WhatsappBotConfig" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "label" TEXT,
    "businessName" TEXT NOT NULL,
    "businessProfile" JSONB,
    "tone" TEXT,
    "greeting" TEXT,
    "fallbackMessage" TEXT,
    "handoffKeyword" TEXT NOT NULL DEFAULT 'atendente',
    "knowledge" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappBotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactName" TEXT,
    "mode" "WhatsappConvMode" NOT NULL DEFAULT 'BOT',
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "WhatsappMsgDirection" NOT NULL,
    "waMessageId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "text" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappBotConfig_phoneNumberId_key" ON "WhatsappBotConfig"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_mode_idx" ON "WhatsappConversation"("mode");

-- CreateIndex
CREATE INDEX "WhatsappConversation_lastInboundAt_idx" ON "WhatsappConversation"("lastInboundAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_phoneNumberId_contactPhone_key" ON "WhatsappConversation"("phoneNumberId", "contactPhone");

-- CreateIndex
CREATE INDEX "WhatsappMessage_conversationId_createdAt_idx" ON "WhatsappMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappMessage_waMessageId_idx" ON "WhatsappMessage"("waMessageId");

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
