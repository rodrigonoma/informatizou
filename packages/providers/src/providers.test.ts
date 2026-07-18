import { describe, expect, it } from 'vitest';
import { getAiProvider, DisabledAiProvider, AnthropicAiProvider } from './ai/index.js';
import { getEmailProvider, DisabledEmailProvider } from './email/index.js';
import { getWhatsAppProvider, DisabledWhatsAppProvider } from './whatsapp/index.js';
import { ProviderNotConfiguredError, ProviderDisabledError } from './errors.js';

describe('getAiProvider', () => {
  it('sem chave → DisabledAiProvider', () => {
    const p = getAiProvider({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: '' });
    expect(p).toBeInstanceOf(DisabledAiProvider);
  });

  it('com chave → AnthropicAiProvider', () => {
    const p = getAiProvider({
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-test',
      ANTHROPIC_MODEL: 'claude-opus-4-8',
    });
    expect(p).toBeInstanceOf(AnthropicAiProvider);
  });

  it('AnthropicAiProvider lança ProviderNotConfiguredError sem chave', () => {
    expect(() => new AnthropicAiProvider({ apiKey: '', model: 'x' })).toThrow(
      ProviderNotConfiguredError,
    );
  });

  it('DisabledAiProvider recusa geração', async () => {
    const p = new DisabledAiProvider();
    await expect(
      p.generateWebsiteContent({
        business: { businessId: 'b1', name: 'X' },
        template: 'modern-food',
      }),
    ).rejects.toBeInstanceOf(ProviderDisabledError);
  });
});

describe('getEmailProvider', () => {
  it('entrega desabilitada → DisabledEmailProvider', () => {
    const p = getEmailProvider({ EMAIL_PROVIDER: 'smtp', ENABLE_EMAIL_DELIVERY: false });
    expect(p).toBeInstanceOf(DisabledEmailProvider);
  });

  it('DisabledEmailProvider recusa envio', async () => {
    const p = new DisabledEmailProvider();
    await expect(p.send({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })).rejects.toBeInstanceOf(
      ProviderDisabledError,
    );
  });
});

describe('getWhatsAppProvider', () => {
  it('padrão seguro → DisabledWhatsAppProvider (§4)', () => {
    const p = getWhatsAppProvider({
      WHATSAPP_PROVIDER: 'disabled',
      ENABLE_WHATSAPP_DELIVERY: false,
    });
    expect(p).toBeInstanceOf(DisabledWhatsAppProvider);
    expect(p.canSend()).toBe(false);
  });

  it('não envia mesmo com provider oficial se entrega desabilitada', () => {
    const p = getWhatsAppProvider({
      WHATSAPP_PROVIDER: 'cloud_api',
      ENABLE_WHATSAPP_DELIVERY: false,
      WHATSAPP_ACCESS_TOKEN: 'tok',
      WHATSAPP_PHONE_NUMBER_ID: 'pid',
    });
    expect(p).toBeInstanceOf(DisabledWhatsAppProvider);
  });
});
