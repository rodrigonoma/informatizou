// Subpath server-only de @informatizou/shared.
// Reexporta tudo do barrel browser-safe + utilitários que dependem de APIs Node
// (ex.: node:crypto). NÃO importar este módulo no frontend.
export * from './index.js';
export { generateCampaignToken } from './utils/campaign-token.js';
