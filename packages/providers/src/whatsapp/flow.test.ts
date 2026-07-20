import { describe, expect, it } from 'vitest';
import { decideFlow, normalize, isWithinHours, type BotFlowConfig } from './flow.js';

const base: BotFlowConfig = {
  aiEnabled: true,
  greeting: 'Olá! Aqui é a Padaria Sol.',
  awayMessage: 'Estamos fechados agora. Responda que retornamos no horário.',
  handoffMessage: 'Vou chamar um atendente.',
  handoffKeyword: 'atendente',
  fallbackMessage: 'Recebido!',
  menuEnabled: true,
  menuHeader: 'Escolha:',
  options: [
    { key: '1', label: 'Horários', keywords: ['horario', 'abre'], response: 'Seg a sex, 8h às 18h.' },
    { key: '2', label: 'Falar com atendente', response: 'Já chamo alguém!', handoff: true },
  ],
  businessHours: null,
};

const now = new Date('2026-01-05T15:00:00Z'); // seg, 12h em São Paulo

describe('normalize', () => {
  it('remove acentos e caixa', () => {
    expect(normalize('  HORÁRIO ')).toBe('horario');
    expect(normalize('Atenção')).toBe('atencao');
  });
});

describe('isWithinHours', () => {
  const hours = { enabled: true, tz: 'America/Sao_Paulo', days: { '1': [['09:00', '18:00'] as [string, string]] } };
  it('dentro do horário', () => {
    expect(isWithinHours(hours, new Date('2026-01-05T15:00:00Z'))).toBe(true); // 12h seg
  });
  it('fora do horário (domingo)', () => {
    expect(isWithinHours(hours, new Date('2026-01-04T15:00:00Z'))).toBe(false); // domingo
  });
  it('desabilitado => sempre aberto', () => {
    expect(isWithinHours({ enabled: false, days: {} }, now)).toBe(true);
  });
});

describe('decideFlow', () => {
  it('palavra-chave de handoff transfere', () => {
    const d = decideFlow(base, 'quero falar com atendente', { firstContact: false, now });
    expect(d.kind).toBe('handoff');
  });

  it('casa opção por número', () => {
    const d = decideFlow(base, '1', { firstContact: false, now });
    expect(d).toMatchObject({ kind: 'option', text: 'Seg a sex, 8h às 18h.', handoff: false });
  });

  it('casa opção por palavra-chave', () => {
    const d = decideFlow(base, 'que horas abre?', { firstContact: false, now });
    expect(d.kind).toBe('option');
  });

  it('opção com handoff marca transferência', () => {
    const d = decideFlow(base, '2', { firstContact: false, now });
    expect(d).toMatchObject({ kind: 'option', handoff: true });
  });

  it('primeiro contato manda saudação + menu', () => {
    const d = decideFlow(base, 'oi', { firstContact: true, now });
    expect(d.kind).toBe('greeting');
    if (d.kind === 'greeting') {
      expect(d.text).toContain('Padaria Sol');
      expect(d.text).toContain('1. Horários');
    }
  });

  it('sem casar e IA ligada => ai', () => {
    const d = decideFlow(base, 'vocês entregam?', { firstContact: false, now });
    expect(d.kind).toBe('ai');
  });

  it('IA desligada e sem menu => fallback', () => {
    const d = decideFlow(
      { ...base, aiEnabled: false, menuEnabled: false },
      'qualquer coisa',
      { firstContact: false, now },
    );
    expect(d).toMatchObject({ kind: 'fallback' });
  });

  it('fora do horário responde awayMessage', () => {
    const cfg = { ...base, businessHours: { enabled: true, tz: 'America/Sao_Paulo', days: { '1': [['09:00', '10:00'] as [string, string]] } } };
    const d = decideFlow(cfg, 'oi', { firstContact: false, now }); // 12h fora de 9-10
    expect(d).toMatchObject({ kind: 'away' });
  });
});
