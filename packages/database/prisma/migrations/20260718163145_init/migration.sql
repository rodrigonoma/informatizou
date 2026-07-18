-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebsiteFilter" AS ENUM ('ANY', 'WITHOUT_VALID_INSTITUTIONAL_WEBSITE', 'ONLY_WITH_WEBSITE');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('NO_WEBSITE', 'VALID_INSTITUTIONAL_WEBSITE', 'OUTDATED_WEBSITE', 'BROKEN_WEBSITE', 'SOCIAL_MEDIA_ONLY', 'MARKETPLACE_ONLY', 'LINK_AGGREGATOR_ONLY', 'DOMAIN_PARKED', 'UNDER_CONSTRUCTION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('UNKNOWN', 'AVAILABLE', 'UNAVAILABLE', 'OPTED_IN', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "ScoreCategory" AS ENUM ('EXCELLENT', 'STRONG', 'MODERATE', 'WEAK', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_REVIEWED', 'AUTOMATICALLY_APPROVED', 'MANUAL_REVIEW_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImageSourceType" AS ENUM ('BUSINESS_PUBLIC_SOURCE', 'LICENSED_STOCK', 'GENERATED', 'PLACEHOLDER');

-- CreateEnum
CREATE TYPE "DemoSiteStatus" AS ENUM ('DRAFT', 'GENERATING', 'REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED', 'EXPIRED', 'SOLD', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "ScreenshotType" AS ENUM ('DESKTOP', 'MOBILE', 'SOCIAL_PREVIEW', 'FULL_PAGE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'PROCESSING', 'QUALIFIED', 'REJECTED', 'REVIEW_REQUIRED', 'DEMO_GENERATING', 'DEMO_REVIEW', 'DEMO_READY', 'READY_TO_CONTACT', 'CONTACT_APPROVAL_REQUIRED', 'CONTACTED', 'DELIVERED', 'OPENED', 'DEMO_VIEWED', 'REPLIED', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST', 'EXPIRED', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "OutreachMode" AS ENUM ('MANUAL', 'APPROVAL_REQUIRED', 'AUTOMATIC_WHEN_ALLOWED');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'INSTAGRAM_DIRECT', 'PHONE', 'MANUAL');

-- CreateEnum
CREATE TYPE "OutreachMessageStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('REQUESTED', 'COMPLAINT', 'INVALID_CONTACT', 'BLOCKED_BY_ADMIN', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductPlanType" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "radiusKm" INTEGER,
    "resultLimit" INTEGER NOT NULL DEFAULT 300,
    "minimumRating" DOUBLE PRECISION,
    "minimumReviewCount" INTEGER,
    "websiteFilter" "WebsiteFilter" NOT NULL DEFAULT 'WITHOUT_VALID_INSTITUTIONAL_WEBSITE',
    "minimumScoreForDemo" INTEGER NOT NULL DEFAULT 80,
    "maximumDemos" INTEGER NOT NULL DEFAULT 25,
    "provider" TEXT NOT NULL DEFAULT 'fake',
    "automaticDemoGeneration" BOOLEAN NOT NULL DEFAULT false,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignToken" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SearchCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignExecution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "businessesFound" INTEGER NOT NULL DEFAULT 0,
    "businessesProcessed" INTEGER NOT NULL DEFAULT 0,
    "duplicatesRemoved" INTEGER NOT NULL DEFAULT 0,
    "withWebsite" INTEGER NOT NULL DEFAULT 0,
    "withoutWebsite" INTEGER NOT NULL DEFAULT 0,
    "leadsQualified" INTEGER NOT NULL DEFAULT 0,
    "demosCreated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "progress" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCost" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "categories" TEXT[],
    "address" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "phoneE164" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "openingHours" JSONB,
    "operationalStatus" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "rawData" JSONB,
    "campaignId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "templateKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSourceRecord" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "rawData" JSONB,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContact" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueNormalized" TEXT,
    "kind" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "source" TEXT,
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSocialProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "handle" TEXT,
    "isActive" BOOLEAN,
    "followers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessImage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "demoSiteId" TEXT,
    "sourceType" "ImageSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "license" TEXT,
    "storageUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReviewSummary" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "recurringPhrases" TEXT[],
    "sentiment" TEXT,
    "sampledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessReviewSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteVerification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'UNKNOWN',
    "followedRedirects" JSONB,
    "dnsValid" BOOLEAN,
    "httpOk" BOOLEAN,
    "httpsOk" BOOLEAN,
    "certificateValid" BOOLEAN,
    "nameMatch" BOOLEAN,
    "contactMatch" BOOLEAN,
    "signals" JSONB,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteCandidate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "discoveredVia" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "businessId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "scoreTotal" INTEGER,
    "scoreCategory" "ScoreCategory",
    "websiteStatus" "WebsiteStatus",
    "assignedToId" TEXT,
    "priority" INTEGER,
    "contactedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScore" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "category" "ScoreCategory" NOT NULL,
    "items" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadReview" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "checklist" JSONB,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "channel" TEXT,
    "metadata" JSONB,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoSite" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "DemoSiteStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB,
    "designTokens" JSONB,
    "publicUrl" TEXT,
    "campaignToken" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitorCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DemoSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoSiteVersion" (
    "id" TEXT NOT NULL,
    "demoSiteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "template" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSiteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoSitePublication" (
    "id" TEXT NOT NULL,
    "demoSiteId" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "unpublishedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSitePublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteScreenshot" (
    "id" TEXT NOT NULL,
    "demoSiteId" TEXT NOT NULL,
    "type" "ScreenshotType" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "demoSiteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "campaignToken" TEXT,
    "visitorHash" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "referrer" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "status" "OutreachMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variant" TEXT,
    "demoUrl" TEXT,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachApproval" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "approverId" TEXT,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachAttempt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachConversation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "externalRef" TEXT,
    "status" TEXT,
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachResponse" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "leadId" TEXT,
    "channel" "OutreachChannel" NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "classification" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressionEntry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "domain" TEXT,
    "reason" "SuppressionReason" NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuppressionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductPlanType" NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "ownerId" TEXT,
    "description" TEXT,
    "scope" TEXT,
    "implementationCents" INTEGER,
    "monthlyCents" INTEGER,
    "deadline" TEXT,
    "conditions" TEXT,
    "validUntil" TIMESTAMP(3),
    "includedItems" TEXT[],
    "excludedItems" TEXT[],
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "htmlUrl" TEXT,
    "pdfUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "productPlanId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductPlanType" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "domain" TEXT,
    "temporaryUrl" TEXT,
    "status" TEXT,
    "demoSiteId" TEXT,
    "indexingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSubscription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productPlanId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priceCents" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOnboardingTask" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUsage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "leadId" TEXT,
    "demoSiteId" TEXT,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "inputUnits" INTEGER,
    "outputUnits" INTEGER,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correlationId" TEXT,
    "campaignId" TEXT,
    "leadId" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportFile" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "storageUrl" TEXT,
    "filters" JSONB,
    "rowCount" INTEGER,
    "requestedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchCampaign_campaignToken_key" ON "SearchCampaign"("campaignToken");

-- CreateIndex
CREATE INDEX "SearchCampaign_status_idx" ON "SearchCampaign"("status");

-- CreateIndex
CREATE INDEX "SearchCampaign_deletedAt_idx" ON "SearchCampaign"("deletedAt");

-- CreateIndex
CREATE INDEX "CampaignExecution_campaignId_idx" ON "CampaignExecution"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignExecution_status_idx" ON "CampaignExecution"("status");

-- CreateIndex
CREATE INDEX "CampaignCost_campaignId_idx" ON "CampaignCost"("campaignId");

-- CreateIndex
CREATE INDEX "Business_normalizedName_idx" ON "Business"("normalizedName");

-- CreateIndex
CREATE INDEX "Business_phoneE164_idx" ON "Business"("phoneE164");

-- CreateIndex
CREATE INDEX "Business_city_state_idx" ON "Business"("city", "state");

-- CreateIndex
CREATE INDEX "Business_deletedAt_idx" ON "Business"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Business_source_externalId_key" ON "Business"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_name_key" ON "BusinessCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_slug_key" ON "BusinessCategory"("slug");

-- CreateIndex
CREATE INDEX "BusinessSourceRecord_businessId_idx" ON "BusinessSourceRecord"("businessId");

-- CreateIndex
CREATE INDEX "BusinessContact_businessId_idx" ON "BusinessContact"("businessId");

-- CreateIndex
CREATE INDEX "BusinessContact_type_idx" ON "BusinessContact"("type");

-- CreateIndex
CREATE INDEX "BusinessContact_valueNormalized_idx" ON "BusinessContact"("valueNormalized");

-- CreateIndex
CREATE INDEX "BusinessSocialProfile_businessId_idx" ON "BusinessSocialProfile"("businessId");

-- CreateIndex
CREATE INDEX "BusinessImage_businessId_idx" ON "BusinessImage"("businessId");

-- CreateIndex
CREATE INDEX "BusinessImage_demoSiteId_idx" ON "BusinessImage"("demoSiteId");

-- CreateIndex
CREATE INDEX "BusinessImage_hash_idx" ON "BusinessImage"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessReviewSummary_businessId_key" ON "BusinessReviewSummary"("businessId");

-- CreateIndex
CREATE INDEX "WebsiteVerification_businessId_idx" ON "WebsiteVerification"("businessId");

-- CreateIndex
CREATE INDEX "WebsiteVerification_status_idx" ON "WebsiteVerification"("status");

-- CreateIndex
CREATE INDEX "WebsiteCandidate_businessId_idx" ON "WebsiteCandidate"("businessId");

-- CreateIndex
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");

-- CreateIndex
CREATE INDEX "Lead_businessId_idx" ON "Lead"("businessId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadScore_leadId_key" ON "LeadScore"("leadId");

-- CreateIndex
CREATE INDEX "LeadReview_leadId_idx" ON "LeadReview"("leadId");

-- CreateIndex
CREATE INDEX "LeadReview_status_idx" ON "LeadReview"("status");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_idx" ON "LeadAssignment"("leadId");

-- CreateIndex
CREATE INDEX "LeadAssignment_userId_idx" ON "LeadAssignment"("userId");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "LeadActivity"("type");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadTag_tag_idx" ON "LeadTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTag_leadId_tag_key" ON "LeadTag"("leadId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "DemoSite_leadId_key" ON "DemoSite"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoSite_slug_key" ON "DemoSite"("slug");

-- CreateIndex
CREATE INDEX "DemoSite_status_idx" ON "DemoSite"("status");

-- CreateIndex
CREATE INDEX "DemoSite_expiresAt_idx" ON "DemoSite"("expiresAt");

-- CreateIndex
CREATE INDEX "DemoSite_deletedAt_idx" ON "DemoSite"("deletedAt");

-- CreateIndex
CREATE INDEX "DemoSiteVersion_demoSiteId_idx" ON "DemoSiteVersion"("demoSiteId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoSiteVersion_demoSiteId_version_key" ON "DemoSiteVersion"("demoSiteId", "version");

-- CreateIndex
CREATE INDEX "DemoSitePublication_demoSiteId_idx" ON "DemoSitePublication"("demoSiteId");

-- CreateIndex
CREATE INDEX "SiteScreenshot_demoSiteId_idx" ON "SiteScreenshot"("demoSiteId");

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_demoSiteId_type_idx" ON "DemoAnalyticsEvent"("demoSiteId", "type");

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_createdAt_idx" ON "DemoAnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_leadId_idx" ON "OutreachMessage"("leadId");

-- CreateIndex
CREATE INDEX "OutreachMessage_status_idx" ON "OutreachMessage"("status");

-- CreateIndex
CREATE INDEX "OutreachMessage_channel_idx" ON "OutreachMessage"("channel");

-- CreateIndex
CREATE INDEX "OutreachApproval_messageId_idx" ON "OutreachApproval"("messageId");

-- CreateIndex
CREATE INDEX "OutreachAttempt_messageId_idx" ON "OutreachAttempt"("messageId");

-- CreateIndex
CREATE INDEX "OutreachConversation_leadId_idx" ON "OutreachConversation"("leadId");

-- CreateIndex
CREATE INDEX "OutreachResponse_conversationId_idx" ON "OutreachResponse"("conversationId");

-- CreateIndex
CREATE INDEX "OutreachResponse_leadId_idx" ON "OutreachResponse"("leadId");

-- CreateIndex
CREATE INDEX "SuppressionEntry_phone_idx" ON "SuppressionEntry"("phone");

-- CreateIndex
CREATE INDEX "SuppressionEntry_email_idx" ON "SuppressionEntry"("email");

-- CreateIndex
CREATE INDEX "SuppressionEntry_domain_idx" ON "SuppressionEntry"("domain");

-- CreateIndex
CREATE INDEX "SuppressionEntry_businessId_idx" ON "SuppressionEntry"("businessId");

-- CreateIndex
CREATE INDEX "Proposal_leadId_idx" ON "Proposal"("leadId");

-- CreateIndex
CREATE INDEX "Proposal_customerId_idx" ON "Proposal"("customerId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "ProposalItem_proposalId_idx" ON "ProposalItem"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_leadId_key" ON "Customer"("leadId");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE INDEX "CustomerSite_customerId_idx" ON "CustomerSite"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSubscription_customerId_idx" ON "CustomerSubscription"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSubscription_status_idx" ON "CustomerSubscription"("status");

-- CreateIndex
CREATE INDEX "CustomerOnboardingTask_customerId_idx" ON "CustomerOnboardingTask"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_key_key" ON "Integration"("key");

-- CreateIndex
CREATE INDEX "ProviderUsage_provider_idx" ON "ProviderUsage"("provider");

-- CreateIndex
CREATE INDEX "ProviderUsage_campaignId_idx" ON "ProviderUsage"("campaignId");

-- CreateIndex
CREATE INDEX "ProviderUsage_createdAt_idx" ON "ProviderUsage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "JobExecution_queue_status_idx" ON "JobExecution"("queue", "status");

-- CreateIndex
CREATE INDEX "JobExecution_correlationId_idx" ON "JobExecution"("correlationId");

-- CreateIndex
CREATE INDEX "JobExecution_createdAt_idx" ON "JobExecution"("createdAt");

-- CreateIndex
CREATE INDEX "ExportFile_type_idx" ON "ExportFile"("type");

-- CreateIndex
CREATE INDEX "ExportFile_status_idx" ON "ExportFile"("status");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignExecution" ADD CONSTRAINT "CampaignExecution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCost" ADD CONSTRAINT "CampaignCost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSourceRecord" ADD CONSTRAINT "BusinessSourceRecord_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContact" ADD CONSTRAINT "BusinessContact_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSocialProfile" ADD CONSTRAINT "BusinessSocialProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImage" ADD CONSTRAINT "BusinessImage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImage" ADD CONSTRAINT "BusinessImage_demoSiteId_fkey" FOREIGN KEY ("demoSiteId") REFERENCES "DemoSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReviewSummary" ADD CONSTRAINT "BusinessReviewSummary_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteVerification" ADD CONSTRAINT "WebsiteVerification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteCandidate" ADD CONSTRAINT "WebsiteCandidate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SearchCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReview" ADD CONSTRAINT "LeadReview_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReview" ADD CONSTRAINT "LeadReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTag" ADD CONSTRAINT "LeadTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSite" ADD CONSTRAINT "DemoSite_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSiteVersion" ADD CONSTRAINT "DemoSiteVersion_demoSiteId_fkey" FOREIGN KEY ("demoSiteId") REFERENCES "DemoSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSitePublication" ADD CONSTRAINT "DemoSitePublication_demoSiteId_fkey" FOREIGN KEY ("demoSiteId") REFERENCES "DemoSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteScreenshot" ADD CONSTRAINT "SiteScreenshot_demoSiteId_fkey" FOREIGN KEY ("demoSiteId") REFERENCES "DemoSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoAnalyticsEvent" ADD CONSTRAINT "DemoAnalyticsEvent_demoSiteId_fkey" FOREIGN KEY ("demoSiteId") REFERENCES "DemoSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachApproval" ADD CONSTRAINT "OutreachApproval_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachApproval" ADD CONSTRAINT "OutreachApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachAttempt" ADD CONSTRAINT "OutreachAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachConversation" ADD CONSTRAINT "OutreachConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachResponse" ADD CONSTRAINT "OutreachResponse_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "OutreachConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachResponse" ADD CONSTRAINT "OutreachResponse_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachResponse" ADD CONSTRAINT "OutreachResponse_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "ProductPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSite" ADD CONSTRAINT "CustomerSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "ProductPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOnboardingTask" ADD CONSTRAINT "CustomerOnboardingTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
