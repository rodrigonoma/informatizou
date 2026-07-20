-- AlterTable
ALTER TABLE "WhatsappBotConfig" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "awayMessage" TEXT,
ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "handoffMessage" TEXT,
ADD COLUMN     "menuEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "menuHeader" TEXT,
ADD COLUMN     "options" JSONB;
