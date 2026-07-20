/** As 24 filas da plataforma (spec §39). */
export const QUEUE_NAMES = {
  BUSINESS_SEARCH: 'business-search',
  BUSINESS_DETAILS: 'business-details',
  BUSINESS_DEDUPLICATION: 'business-deduplication',
  WEBSITE_DISCOVERY: 'website-discovery',
  WEBSITE_VERIFICATION: 'website-verification',
  BUSINESS_ENRICHMENT: 'business-enrichment',
  CONTACT_VALIDATION: 'contact-validation',
  LEAD_SCORING: 'lead-scoring',
  LEAD_REVIEW: 'lead-review',
  WEBSITE_CONTENT_GENERATION: 'website-content-generation',
  WEBSITE_CONTENT_REVIEW: 'website-content-review',
  DEMO_GENERATION: 'demo-generation',
  DEMO_PUBLICATION: 'demo-publication',
  SCREENSHOT_GENERATION: 'screenshot-generation',
  DEMO_EXPIRATION: 'demo-expiration',
  OUTREACH_MESSAGE_GENERATION: 'outreach-message-generation',
  OUTREACH_APPROVAL: 'outreach-approval',
  OUTREACH_DELIVERY: 'outreach-delivery',
  OUTREACH_RESPONSE_PROCESSING: 'outreach-response-processing',
  ANALYTICS_PROCESSING: 'analytics-processing',
  PROPOSAL_GENERATION: 'proposal-generation',
  EXPORT_GENERATION: 'export-generation',
  CLEANUP: 'cleanup',
  BACKUP: 'backup',
  // Chatbot de WhatsApp (Cloud API): processa mensagens recebidas e responde por IA.
  WHATSAPP_INBOUND: 'whatsapp-inbound',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const ALL_QUEUE_NAMES: QueueName[] = Object.values(QUEUE_NAMES);
