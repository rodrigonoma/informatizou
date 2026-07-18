import { describe, expect, it } from 'vitest';
import { generateCampaignToken } from './campaign-token.js';

describe('generateCampaignToken', () => {
  it('gera token apenas com [A-Za-z0-9], sem hífen', () => {
    const token = generateCampaignToken();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
    expect(token).not.toContain('-');
  });

  it('tem comprimento mínimo razoável', () => {
    expect(generateCampaignToken().length).toBeGreaterThanOrEqual(18);
  });

  it('gera tokens diferentes a cada chamada', () => {
    const a = generateCampaignToken();
    const b = generateCampaignToken();
    expect(a).not.toBe(b);
  });
});
