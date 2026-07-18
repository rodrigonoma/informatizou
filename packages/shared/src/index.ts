// Enums
export * from './enums.js';

// Tipos de domínio
export * from './types.js';

// Schemas Zod
export * from './schemas/index.js';

// Utils
export { slugify } from './utils/slug.js';
export { normalizeName } from './utils/name.js';
export { toE164, type PhoneParseResult } from './utils/phone.js';
export { classifyEmail, type EmailClassification } from './utils/email.js';
export { generateCampaignToken } from './utils/campaign-token.js';
export { isSafeHttpUrl, type UrlGuardResult } from './utils/url-guard.js';
