import { describe, expect, it } from 'vitest';
import { buildProposalHtml, formatBRL } from './proposal.js';

describe('formatBRL', () => {
  it('formata centavos em BRL', () => {
    expect(formatBRL(150000)).toContain('1.500,00');
    expect(formatBRL(9900)).toContain('99,00');
  });
});

describe('buildProposalHtml (§32)', () => {
  const html = buildProposalHtml({
    businessName: 'Padaria Maresias',
    responsibleName: 'João',
    description: 'Proposta de criação de site.',
    scope: 'Site institucional com formulário e WhatsApp.',
    implementationCents: 150000,
    monthlyCents: 9900,
    deadline: '10 dias úteis',
    conditions: '50% na aprovação, 50% na entrega.',
    validUntil: '30/07/2026',
    includedItems: ['Domínio', 'SSL', 'Hospedagem'],
    excludedItems: ['Fotografia profissional'],
    items: [{ name: 'Criação do site', priceCents: 150000, quantity: 1 }],
  });

  it('inclui empresa, valores e Informatizou', () => {
    expect(html).toContain('Padaria Maresias');
    expect(html).toContain('Informatizou');
    expect(html).toContain('1.500,00');
    expect(html).toContain('99,00');
  });

  it('lista incluídos e não incluídos', () => {
    expect(html).toContain('Domínio');
    expect(html).toContain('Fotografia profissional');
  });

  it('escapa HTML da entrada', () => {
    const h = buildProposalHtml({
      businessName: '<script>x</script>',
      includedItems: [],
      excludedItems: [],
      items: [],
    });
    expect(h).not.toContain('<script>x');
    expect(h).toContain('&lt;script&gt;');
  });

  it('mostra traço quando não há valores', () => {
    const h = buildProposalHtml({ businessName: 'X', includedItems: [], excludedItems: [], items: [] });
    expect(h).toContain('—');
  });
});
