import { describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  sendCloudApiText,
  verifyWhatsappSignature,
  parseInboundMessages,
  type FetchLike,
} from './index.js';

function jsonRes(body: unknown, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(body), json: async () => body };
}

describe('verifyWhatsappSignature', () => {
  const secret = 's3cr3t';
  const raw = '{"a":1}';
  const sig = 'sha256=' + createHmac('sha256', secret).update(raw, 'utf8').digest('hex');

  it('aceita assinatura correta', () => {
    expect(verifyWhatsappSignature(secret, raw, sig)).toBe(true);
  });
  it('rejeita assinatura incorreta', () => {
    expect(verifyWhatsappSignature(secret, raw, 'sha256=deadbeef')).toBe(false);
  });
  it('rejeita quando falta assinatura (com segredo)', () => {
    expect(verifyWhatsappSignature(secret, raw, undefined)).toBe(false);
  });
  it('sem segredo configurado, não valida (dev)', () => {
    expect(verifyWhatsappSignature('', raw, undefined)).toBe(true);
  });
});

describe('parseInboundMessages', () => {
  it('extrai phoneNumberId, nome e texto', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: '123', display_phone_number: '551199999' },
                contacts: [{ profile: { name: 'Maria' } }],
                messages: [{ from: '5511987654321', id: 'wamid.AAA', type: 'text', text: { body: 'Oi, vocês abrem sábado?' } }],
              },
            },
          ],
        },
      ],
    };
    const batch = parseInboundMessages(payload);
    expect(batch.phoneNumberId).toBe('123');
    expect(batch.messages).toHaveLength(1);
    expect(batch.messages[0]).toMatchObject({
      from: '5511987654321',
      waMessageId: 'wamid.AAA',
      type: 'text',
      text: 'Oi, vocês abrem sábado?',
      contactName: 'Maria',
    });
  });

  it('ignora payloads sem mensagens (ex.: status)', () => {
    const batch = parseInboundMessages({ entry: [{ changes: [{ value: { statuses: [] } }] }] });
    expect(batch.messages).toHaveLength(0);
  });
});

describe('sendCloudApiText', () => {
  it('envia texto e retorna o id', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRes({ messages: [{ id: 'wamid.OUT1' }] }),
    ) as unknown as FetchLike;
    const res = await sendCloudApiText({
      phoneNumberId: '123',
      accessToken: 'tok',
      to: '5511987654321',
      text: 'Olá!',
      fetchImpl,
    });
    expect(res.accepted).toBe(true);
    expect(res.providerMessageId).toBe('wamid.OUT1');

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toContain('/123/messages');
    expect(init.headers.Authorization).toBe('Bearer tok');
    const body = JSON.parse(init.body);
    expect(body.type).toBe('text');
    expect(body.text.body).toBe('Olá!');
  });

  it('lança erro em HTTP não-ok', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ error: {} }, false, 401)) as unknown as FetchLike;
    await expect(
      sendCloudApiText({ phoneNumberId: '1', accessToken: 't', to: 'x', text: 'y', fetchImpl }),
    ).rejects.toThrow(/HTTP 401/);
  });
});
