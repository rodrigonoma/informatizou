/**
 * Enums oficiais da spec (§6, §8, §10, §12, §13, §14, §17, §18, §22, §24, §27, §29, §31, §32).
 * Fonte única de verdade — espelhados no schema Prisma (mantê-los em sincronia).
 */

/** Perfis de usuário (§6). */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  REVIEWER = 'REVIEWER',
  VIEWER = 'VIEWER',
}

/** Status de campanha (§8). */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

/** Filtro de website da campanha (§8). */
export enum WebsiteFilter {
  ANY = 'ANY',
  WITHOUT_VALID_INSTITUTIONAL_WEBSITE = 'WITHOUT_VALID_INSTITUTIONAL_WEBSITE',
  ONLY_WITH_WEBSITE = 'ONLY_WITH_WEBSITE',
}

/** Status de verificação de site institucional (§10). */
export enum WebsiteStatus {
  NO_WEBSITE = 'NO_WEBSITE',
  VALID_INSTITUTIONAL_WEBSITE = 'VALID_INSTITUTIONAL_WEBSITE',
  OUTDATED_WEBSITE = 'OUTDATED_WEBSITE',
  BROKEN_WEBSITE = 'BROKEN_WEBSITE',
  SOCIAL_MEDIA_ONLY = 'SOCIAL_MEDIA_ONLY',
  MARKETPLACE_ONLY = 'MARKETPLACE_ONLY',
  LINK_AGGREGATOR_ONLY = 'LINK_AGGREGATOR_ONLY',
  DOMAIN_PARKED = 'DOMAIN_PARKED',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  UNKNOWN = 'UNKNOWN',
}

/** Estado de contato de WhatsApp (§12). */
export enum WhatsAppStatus {
  UNKNOWN = 'UNKNOWN',
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  OPTED_IN = 'OPTED_IN',
  OPTED_OUT = 'OPTED_OUT',
}

/** Categoria do score comercial (§13). */
export enum ScoreCategory {
  EXCELLENT = 'EXCELLENT',
  STRONG = 'STRONG',
  MODERATE = 'MODERATE',
  WEAK = 'WEAK',
  REJECTED = 'REJECTED',
}

/** Status da fila de revisão do lead (§14). */
export enum ReviewStatus {
  NOT_REVIEWED = 'NOT_REVIEWED',
  AUTOMATICALLY_APPROVED = 'AUTOMATICALLY_APPROVED',
  MANUAL_REVIEW_REQUIRED = 'MANUAL_REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Origem/tipo de imagem (§17). */
export enum ImageSourceType {
  BUSINESS_PUBLIC_SOURCE = 'BUSINESS_PUBLIC_SOURCE',
  LICENSED_STOCK = 'LICENSED_STOCK',
  GENERATED = 'GENERATED',
  PLACEHOLDER = 'PLACEHOLDER',
}

/** Status de uma demonstração (§18). */
export enum DemoSiteStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  SOLD = 'SOLD',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
}

/** Tipo de screenshot (§22). */
export enum ScreenshotType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  SOCIAL_PREVIEW = 'SOCIAL_PREVIEW',
  FULL_PAGE = 'FULL_PAGE',
}

/** Status do lead no CRM (§24). */
export enum LeadStatus {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  QUALIFIED = 'QUALIFIED',
  REJECTED = 'REJECTED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  DEMO_GENERATING = 'DEMO_GENERATING',
  DEMO_REVIEW = 'DEMO_REVIEW',
  DEMO_READY = 'DEMO_READY',
  READY_TO_CONTACT = 'READY_TO_CONTACT',
  CONTACT_APPROVAL_REQUIRED = 'CONTACT_APPROVAL_REQUIRED',
  CONTACTED = 'CONTACTED',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  DEMO_VIEWED = 'DEMO_VIEWED',
  REPLIED = 'REPLIED',
  INTERESTED = 'INTERESTED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATING = 'NEGOTIATING',
  WON = 'WON',
  LOST = 'LOST',
  EXPIRED = 'EXPIRED',
  DO_NOT_CONTACT = 'DO_NOT_CONTACT',
}

/** Modo de contato/prospecção (§27). */
export enum OutreachMode {
  MANUAL = 'MANUAL',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  AUTOMATIC_WHEN_ALLOWED = 'AUTOMATIC_WHEN_ALLOWED',
}

/** Canais de contato. */
export enum OutreachChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM_DIRECT = 'INSTAGRAM_DIRECT',
  PHONE = 'PHONE',
  MANUAL = 'MANUAL',
}

/** Status de uma mensagem de prospecção. */
export enum OutreachMessageStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/** Motivo de supressão/opt-out (§29). */
export enum SuppressionReason {
  REQUESTED = 'REQUESTED',
  COMPLAINT = 'COMPLAINT',
  INVALID_CONTACT = 'INVALID_CONTACT',
  BLOCKED_BY_ADMIN = 'BLOCKED_BY_ADMIN',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

/** Tipo de plano/produto (§31). */
export enum ProductPlanType {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
}

/** Status de proposta (§32). */
export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/** Tipo de e-mail classificado (§12). */
export enum EmailKind {
  BUSINESS = 'BUSINESS',
  GENERIC = 'GENERIC',
  PERSONAL = 'PERSONAL',
  INVALID = 'INVALID',
}
