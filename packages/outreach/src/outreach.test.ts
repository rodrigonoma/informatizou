import { describe, expect, it } from 'vitest';
import { OutreachChannel, OutreachMode } from '@informatizou/shared';
import { buildOutreachMessage } from './messages.js';
import { decideOutreach } from './decision.js';
import { classifyReply, isOptOut } from './reply.js';

describe('buildOutreachMessage (§26/§27)', () => {
  it('mensagem-base preenche nome e URL', () => {
    const m = buildOutreachMessage({
      businessName: 'Padaria Maresias',
      demoUrl: 'https://demo.informatizou.com.br/padaria-maresias',
      channel: OutreachChannel.EMAIL,
      variant: 'BASE',
    });
    expect(m.body).toContain('Padaria Maresias');
    expect(m.body).toContain('https://demo.informatizou.com.br/padaria-maresias');
    expect(m.subject).toContain('Padaria Maresias');
  });

  it('e-mail inclui identificação e opção de remoção (§27)', () => {
    const m = buildOutreachMessage({
      businessName: 'X',
      demoUrl: 'u',
      channel: OutreachChannel.EMAIL,
      variant: 'BASE',
    });
    expect(m.body).toContain('Informatizou');
    expect(m.body).toContain('solicitando a remoção');
  });

  it('WhatsApp não tem subject', () => {
    const m = buildOutreachMessage({
      businessName: 'X',
      demoUrl: 'u',
      channel: OutreachChannel.WHATSAPP,
      variant: 'SHORT',
    });
    expect(m.subject).toBeUndefined();
  });

  it('não usa falsa urgência nem promessa de vendas', () => {
    const m = buildOutreachMessage({
      businessName: 'X',
      demoUrl: 'u',
      channel: OutreachChannel.EMAIL,
      variant: 'BASE',
    });
    const lower = m.body.toLowerCase();
    expect(lower).not.toContain('última chance');
    expect(lower).not.toContain('vendas garantidas');
    expect(lower).not.toContain('parceria oficial');
  });
});

describe('decideOutreach (§28)', () => {
  const base = {
    hasBusinessEmail: true,
    hasPhone: true,
    whatsappOptIn: false,
    whatsappEnabled: false,
    emailEnabled: true,
    suppressed: false,
    recentlyContacted: false,
    demoPublished: true,
    outreachMode: OutreachMode.APPROVAL_REQUIRED,
  };

  it('elegível com e-mail → canal EMAIL e exige aprovação', () => {
    const d = decideOutreach(base);
    expect(d.eligible).toBe(true);
    expect(d.recommendedChannel).toBe('EMAIL');
    expect(d.requiresApproval).toBe(true);
  });

  it('supressão bloqueia', () => {
    const d = decideOutreach({ ...base, suppressed: true });
    expect(d.eligible).toBe(false);
    expect(d.blockingReasons.join(' ')).toContain('supressão');
  });

  it('sem demo publicada bloqueia', () => {
    const d = decideOutreach({ ...base, demoPublished: false });
    expect(d.eligible).toBe(false);
  });

  it('modo automático não exige aprovação', () => {
    const d = decideOutreach({ ...base, outreachMode: OutreachMode.AUTOMATIC_WHEN_ALLOWED });
    expect(d.requiresApproval).toBe(false);
  });

  it('sem contato válido bloqueia', () => {
    const d = decideOutreach({ ...base, hasBusinessEmail: false, hasPhone: false });
    expect(d.eligible).toBe(false);
  });
});

describe('classifyReply (§29)', () => {
  it('detecta opt-out', () => {
    expect(classifyReply('Não tenho interesse, remova meu número')).toBe('OPT_OUT');
    expect(isOptOut('pare de enviar')).toBe(true);
    expect(isOptOut('nao envie mais mensagens')).toBe(true);
  });
  it('detecta interesse', () => {
    expect(classifyReply('Gostei! Quanto custa?')).toBe('INTEREST');
  });
  it('neutro quando indefinido', () => {
    expect(classifyReply('ok')).toBe('NEUTRAL');
  });
});
