import { describe, expect, it, vi } from 'vitest';
import { AnthropicAiProvider } from './anthropic.js';
import type { BusinessContext, WebsiteContent } from './types.js';

const business: BusinessContext = {
  businessId: 'b1',
  name: 'Padaria Maresias',
  category: 'bakery',
  city: 'Ribeirão Preto',
  state: 'SP',
  rating: 4.6,
  reviewCount: 210,
  language: 'pt-BR',
};

type ClientParam = ConstructorParameters<typeof AnthropicAiProvider>[0]['client'];

/** Cria um cliente falso cujo `parse` devolve `parsed_output` fixo e registra a chamada. */
function fakeClient(parsedOutput: unknown) {
  const parse = vi.fn(async () => ({ parsed_output: parsedOutput, stop_reason: 'end_turn' }));
  return { client: { parse } as unknown as ClientParam, parse };
}

describe('AnthropicAiProvider', () => {
  it('exige apiKey', () => {
    expect(() => new AnthropicAiProvider({ apiKey: '', model: 'claude-opus-4-8' })).toThrow(
      /não configurado/,
    );
  });

  it('gera conteúdo de site validado por schema', async () => {
    const content: WebsiteContent = {
      title: 'Padaria Maresias',
      subtitle: 'Padaria em Ribeirão Preto',
      intro: 'intro',
      about: 'about',
      sections: [{ key: 'about', heading: 'Sobre', body: 'corpo' }],
      productsOrServices: [],
      differentials: ['Bem avaliado pelos clientes'],
      callToAction: 'Entre em contato',
      seoTitle: 'Padaria Maresias',
      seoDescription: 'desc',
    };
    const { client, parse } = fakeClient(content);
    const provider = new AnthropicAiProvider({ apiKey: 'k', model: 'claude-opus-4-8', client });

    const result = await provider.generateWebsiteContent({ business, template: 'modern-food' });
    expect(result.title).toBe('Padaria Maresias');
    expect(result.productsOrServices).toEqual([]);

    // Verifica que enviou modelo, thinking adaptativo e formato estruturado.
    const args = (parse.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(args.model).toBe('claude-opus-4-8');
    expect(args.thinking).toEqual({ type: 'adaptive' });
    expect((args.output_config as Record<string, unknown>).format).toBeDefined();
  });

  it('outreach EMAIL preserva subject; outros canais descartam', async () => {
    const providerEmail = new AnthropicAiProvider({
      apiKey: 'k',
      model: 'claude-opus-4-8',
      client: fakeClient({ subject: 'Assunto', body: 'corpo' }).client,
    });
    const emailMsg = await providerEmail.generateOutreachMessage({
      business,
      demoUrl: 'https://demo.x/abc',
      channel: 'EMAIL',
    });
    expect(emailMsg.subject).toBe('Assunto');
    expect(emailMsg.body).toBe('corpo');

    const providerWa = new AnthropicAiProvider({
      apiKey: 'k',
      model: 'claude-opus-4-8',
      client: fakeClient({ subject: 'Assunto', body: 'oi' }).client,
    });
    const waMsg = await providerWa.generateOutreachMessage({
      business,
      demoUrl: 'https://demo.x/abc',
      channel: 'WHATSAPP',
    });
    expect(waMsg.subject).toBeUndefined();
    expect(waMsg.body).toBe('oi');
  });

  it('revisão retorna estrutura de conformidade', async () => {
    const provider = new AnthropicAiProvider({
      apiKey: 'k',
      model: 'claude-opus-4-8',
      client: fakeClient({
        approved: false,
        qualityScore: 40,
        issues: ['inventou preço'],
        fabricationSuspected: true,
      }).client,
    });
    const review = await provider.reviewGeneratedContent({
      business,
      content: {
        title: 't',
        subtitle: 's',
        intro: 'i',
        about: 'a',
        sections: [],
        productsOrServices: ['Pizza R$ 50'],
        differentials: [],
        callToAction: 'c',
        seoTitle: 'st',
        seoDescription: 'sd',
      },
    });
    expect(review.fabricationSuspected).toBe(true);
    expect(review.approved).toBe(false);
    expect(review.qualityScore).toBe(40);
  });

  it('lança erro quando parsed_output é nulo', async () => {
    const provider = new AnthropicAiProvider({
      apiKey: 'k',
      model: 'claude-opus-4-8',
      client: fakeClient(null).client,
    });
    await expect(provider.generateBusinessSummary(business)).rejects.toThrow(/saída estruturada/);
  });
});
