/**
 * Enums oficiais da spec (§6, §8, §10, §12, §13, §14, §17, §18, §22, §24, §27, §29, §31, §32).
 * Fonte única de verdade — espelhados no schema Prisma.
 *
 * Implementados como const-object + union type (não `enum` TS) para serem
 * ESTRUTURALMENTE compatíveis com os enums gerados pelo Prisma (unions de
 * string), evitando casts em toda fronteira banco↔domínio.
 */

/** Perfis de usuário (§6). */
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  REVIEWER: 'REVIEWER',
  VIEWER: 'VIEWER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Status de campanha (§8). */
export const CampaignStatus = {
  DRAFT: 'DRAFT',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/** Filtro de website da campanha (§8). */
export const WebsiteFilter = {
  ANY: 'ANY',
  WITHOUT_VALID_INSTITUTIONAL_WEBSITE: 'WITHOUT_VALID_INSTITUTIONAL_WEBSITE',
  ONLY_WITH_WEBSITE: 'ONLY_WITH_WEBSITE',
} as const;
export type WebsiteFilter = (typeof WebsiteFilter)[keyof typeof WebsiteFilter];

/** Status de verificação de site institucional (§10). */
export const WebsiteStatus = {
  NO_WEBSITE: 'NO_WEBSITE',
  VALID_INSTITUTIONAL_WEBSITE: 'VALID_INSTITUTIONAL_WEBSITE',
  OUTDATED_WEBSITE: 'OUTDATED_WEBSITE',
  BROKEN_WEBSITE: 'BROKEN_WEBSITE',
  SOCIAL_MEDIA_ONLY: 'SOCIAL_MEDIA_ONLY',
  MARKETPLACE_ONLY: 'MARKETPLACE_ONLY',
  LINK_AGGREGATOR_ONLY: 'LINK_AGGREGATOR_ONLY',
  DOMAIN_PARKED: 'DOMAIN_PARKED',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
  UNKNOWN: 'UNKNOWN',
} as const;
export type WebsiteStatus = (typeof WebsiteStatus)[keyof typeof WebsiteStatus];

/** Estado de contato de WhatsApp (§12). */
export const WhatsAppStatus = {
  UNKNOWN: 'UNKNOWN',
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  OPTED_IN: 'OPTED_IN',
  OPTED_OUT: 'OPTED_OUT',
} as const;
export type WhatsAppStatus = (typeof WhatsAppStatus)[keyof typeof WhatsAppStatus];

/** Categoria do score comercial (§13). */
export const ScoreCategory = {
  EXCELLENT: 'EXCELLENT',
  STRONG: 'STRONG',
  MODERATE: 'MODERATE',
  WEAK: 'WEAK',
  REJECTED: 'REJECTED',
} as const;
export type ScoreCategory = (typeof ScoreCategory)[keyof typeof ScoreCategory];

/** Status da fila de revisão do lead (§14). */
export const ReviewStatus = {
  NOT_REVIEWED: 'NOT_REVIEWED',
  AUTOMATICALLY_APPROVED: 'AUTOMATICALLY_APPROVED',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

/** Origem/tipo de imagem (§17). */
export const ImageSourceType = {
  BUSINESS_PUBLIC_SOURCE: 'BUSINESS_PUBLIC_SOURCE',
  LICENSED_STOCK: 'LICENSED_STOCK',
  GENERATED: 'GENERATED',
  PLACEHOLDER: 'PLACEHOLDER',
} as const;
export type ImageSourceType = (typeof ImageSourceType)[keyof typeof ImageSourceType];

/** Status de uma demonstração (§18). */
export const DemoSiteStatus = {
  DRAFT: 'DRAFT',
  GENERATING: 'GENERATING',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  EXPIRED: 'EXPIRED',
  SOLD: 'SOLD',
  DISABLED: 'DISABLED',
  DELETED: 'DELETED',
} as const;
export type DemoSiteStatus = (typeof DemoSiteStatus)[keyof typeof DemoSiteStatus];

/** Tipo de screenshot (§22). */
export const ScreenshotType = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
  SOCIAL_PREVIEW: 'SOCIAL_PREVIEW',
  FULL_PAGE: 'FULL_PAGE',
} as const;
export type ScreenshotType = (typeof ScreenshotType)[keyof typeof ScreenshotType];

/** Status do lead no CRM (§24). */
export const LeadStatus = {
  NEW: 'NEW',
  PROCESSING: 'PROCESSING',
  QUALIFIED: 'QUALIFIED',
  REJECTED: 'REJECTED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  DEMO_GENERATING: 'DEMO_GENERATING',
  DEMO_REVIEW: 'DEMO_REVIEW',
  DEMO_READY: 'DEMO_READY',
  READY_TO_CONTACT: 'READY_TO_CONTACT',
  CONTACT_APPROVAL_REQUIRED: 'CONTACT_APPROVAL_REQUIRED',
  CONTACTED: 'CONTACTED',
  DELIVERED: 'DELIVERED',
  OPENED: 'OPENED',
  DEMO_VIEWED: 'DEMO_VIEWED',
  REPLIED: 'REPLIED',
  INTERESTED: 'INTERESTED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATING: 'NEGOTIATING',
  WON: 'WON',
  LOST: 'LOST',
  EXPIRED: 'EXPIRED',
  DO_NOT_CONTACT: 'DO_NOT_CONTACT',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/** Modo de contato/prospecção (§27). */
export const OutreachMode = {
  MANUAL: 'MANUAL',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  AUTOMATIC_WHEN_ALLOWED: 'AUTOMATIC_WHEN_ALLOWED',
} as const;
export type OutreachMode = (typeof OutreachMode)[keyof typeof OutreachMode];

/** Canais de contato. */
export const OutreachChannel = {
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM_DIRECT: 'INSTAGRAM_DIRECT',
  PHONE: 'PHONE',
  MANUAL: 'MANUAL',
} as const;
export type OutreachChannel = (typeof OutreachChannel)[keyof typeof OutreachChannel];

/** Status de uma mensagem de prospecção. */
export const OutreachMessageStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type OutreachMessageStatus =
  (typeof OutreachMessageStatus)[keyof typeof OutreachMessageStatus];

/** Motivo de supressão/opt-out (§29). */
export const SuppressionReason = {
  REQUESTED: 'REQUESTED',
  COMPLAINT: 'COMPLAINT',
  INVALID_CONTACT: 'INVALID_CONTACT',
  BLOCKED_BY_ADMIN: 'BLOCKED_BY_ADMIN',
  LEGAL: 'LEGAL',
  OTHER: 'OTHER',
} as const;
export type SuppressionReason = (typeof SuppressionReason)[keyof typeof SuppressionReason];

/** Tipo de plano/produto (§31). */
export const ProductPlanType = {
  ONE_TIME: 'ONE_TIME',
  MONTHLY: 'MONTHLY',
} as const;
export type ProductPlanType = (typeof ProductPlanType)[keyof typeof ProductPlanType];

/** Status de proposta (§32). */
export const ProposalStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

/** Tipo de e-mail classificado (§12). */
export const EmailKind = {
  BUSINESS: 'BUSINESS',
  GENERIC: 'GENERIC',
  PERSONAL: 'PERSONAL',
  INVALID: 'INVALID',
} as const;
export type EmailKind = (typeof EmailKind)[keyof typeof EmailKind];
