import { z } from 'zod';

/** Schema e montagem dos dados de configuração do chatbot — reutilizado pelo
 *  painel interno e pelo painel do cliente (§DRY). */

export const menuOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  response: z.string().min(1),
  handoff: z.boolean().optional(),
});

export const businessHoursSchema = z.object({
  enabled: z.boolean(),
  tz: z.string().optional(),
  // "0"(dom)…"6"(sáb) => faixas [["09:00","18:00"], ...]
  days: z.record(z.string(), z.array(z.tuple([z.string(), z.string()]))),
});

/** Campos de configuração do bot, sem o `phoneNumberId` (que vem à parte). */
export const botConfigFields = {
  // Credencial de envio deste número (multi-cliente). Só definida via operador.
  accessToken: z.string().optional(),
  wabaId: z.string().optional(),
  label: z.string().optional(),
  businessName: z.string().min(1),
  businessProfile: z.record(z.string(), z.unknown()).optional(),
  tone: z.string().optional(),
  greeting: z.string().optional(),
  awayMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
  handoffMessage: z.string().optional(),
  handoffKeyword: z.string().optional(),
  knowledge: z.string().optional(),
  businessHours: businessHoursSchema.nullable().optional(),
  menuEnabled: z.boolean().optional(),
  menuHeader: z.string().optional(),
  options: z.array(menuOptionSchema).optional(),
  aiEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
} as const;

export const botConfigFieldsSchema = z.object(botConfigFields);
export type BotConfigFields = z.infer<typeof botConfigFieldsSchema>;

export interface BotConfigData {
  businessName: string;
  accessToken?: string;
  wabaId?: string | null;
  label: string | null;
  tone: string | null;
  greeting: string | null;
  awayMessage: string | null;
  fallbackMessage: string | null;
  handoffMessage: string | null;
  handoffKeyword: string;
  knowledge: string | null;
  menuEnabled: boolean;
  menuHeader: string | null;
  aiEnabled: boolean;
  enabled: boolean;
  businessProfile?: object;
  businessHours?: object;
  options?: object;
}

/** Monta o objeto de dados do Prisma a partir do corpo validado.
 *  JSON nulos não são aceitos pelo Prisma — campos JSON só entram quando enviados. */
export function buildBotConfigData(b: BotConfigFields): BotConfigData {
  const data: BotConfigData = {
    businessName: b.businessName,
    label: b.label ?? null,
    tone: b.tone ?? null,
    greeting: b.greeting ?? null,
    awayMessage: b.awayMessage ?? null,
    fallbackMessage: b.fallbackMessage ?? null,
    handoffMessage: b.handoffMessage ?? null,
    handoffKeyword: b.handoffKeyword ?? 'atendente',
    knowledge: b.knowledge ?? null,
    menuEnabled: b.menuEnabled ?? false,
    menuHeader: b.menuHeader ?? null,
    aiEnabled: b.aiEnabled ?? true,
    enabled: b.enabled ?? true,
  };
  if (b.businessProfile !== undefined) data.businessProfile = b.businessProfile as unknown as object;
  if (b.businessHours !== undefined && b.businessHours !== null) {
    data.businessHours = b.businessHours as unknown as object;
  }
  if (b.options !== undefined) data.options = b.options as unknown as object;
  // accessToken só entra quando enviado (não apaga um token existente).
  if (b.accessToken !== undefined) data.accessToken = b.accessToken;
  if (b.wabaId !== undefined) data.wabaId = b.wabaId ?? null;
  return data;
}
