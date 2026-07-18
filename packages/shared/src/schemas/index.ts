import { z } from 'zod';
import { WebsiteFilter } from '../enums.js';

/** Login (spec §35 /auth/login). */
export const loginSchema = z.object({
  email: z.string().email('e-mail inválido'),
  password: z.string().min(1, 'senha obrigatória'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Entrada de pesquisa de empresas (spec §7). */
export const businessSearchInputSchema = z.object({
  segment: z.string().min(1),
  location: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(2).default('BR'),
  radiusKm: z.number().positive().optional(),
  limit: z.number().int().positive().max(2000),
  minimumRating: z.number().min(0).max(5).optional(),
  minimumReviewCount: z.number().int().min(0).optional(),
  language: z.string().min(2).default('pt-BR'),
});
export type BusinessSearchInputDTO = z.infer<typeof businessSearchInputSchema>;

/** Criação de campanha (spec §8). */
export const campaignCreateSchema = z.object({
  name: z.string().min(1),
  segment: z.string().min(1),
  location: z.string().min(1),
  radiusKm: z.number().positive().optional(),
  resultLimit: z.number().int().positive().max(2000).default(300),
  minimumRating: z.number().min(0).max(5).optional(),
  minimumReviewCount: z.number().int().min(0).optional(),
  websiteFilter: z
    .nativeEnum(WebsiteFilter)
    .default(WebsiteFilter.WITHOUT_VALID_INSTITUTIONAL_WEBSITE),
  minimumScoreForDemo: z.number().int().min(0).max(100).default(80),
  maximumDemos: z.number().int().positive().default(25),
  provider: z.string().default('fake'),
  automaticDemoGeneration: z.boolean().default(false),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
