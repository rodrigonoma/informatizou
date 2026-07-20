import { prisma } from '../src/client.js';
import { createLogger } from '@informatizou/logging';

/**
 * Popula o painel de um cliente para demonstração: cria a config do chatbot
 * vinculada ao cliente e algumas conversas de EXEMPLO (claramente marcadas).
 * Parametrizado por ambiente — não fabrica dados de negócios reais (§15):
 *
 *   DEMO_PORTAL_EMAIL=cliente@exemplo.com \
 *   DEMO_PORTAL_PHONE=11999999999 \
 *   pnpm --filter @informatizou/database db:seed-demo-portal:raw
 */
const log = createLogger({ name: 'demo-portal' });

const email = process.env.DEMO_PORTAL_EMAIL;
const phoneNumberId = process.env.DEMO_PORTAL_PHONE ?? '11985117215';
const businessName = process.env.DEMO_PORTAL_BUSINESS ?? 'Meu Negócio (demonstração)';

async function main(): Promise<void> {
  if (!email) throw new Error('defina DEMO_PORTAL_EMAIL');
  const customer = await prisma.customer.findUnique({ where: { portalEmail: email.toLowerCase() } });
  if (!customer) throw new Error(`cliente não encontrado para portalEmail=${email}`);

  // 1) Config do chatbot vinculada ao cliente.
  await prisma.whatsappBotConfig.upsert({
    where: { phoneNumberId },
    update: { customerId: customer.id },
    create: {
      phoneNumberId,
      customerId: customer.id,
      businessName,
      greeting: 'Olá! 👋 Obrigado por chamar a gente. Como posso ajudar?',
      awayMessage: 'Estamos fora do horário de atendimento agora, mas já já retornamos por aqui!',
      fallbackMessage: 'Recebi sua mensagem! Em instantes um atendente responde.',
      handoffMessage: 'Certo! Vou chamar um atendente para continuar com você. 🙌',
      handoffKeyword: 'atendente',
      menuEnabled: true,
      menuHeader: 'Como posso te ajudar? Responda com o número:',
      options: [
        { key: '1', label: 'Horário de funcionamento', keywords: ['horario', 'abre', 'funciona'], response: 'Seg a sex, 9h às 18h. Sábado, 9h às 13h.' },
        { key: '2', label: 'Endereço', keywords: ['endereco', 'onde', 'local'], response: 'Estamos na Rua Exemplo, 123 — Centro.' },
        { key: '3', label: 'Falar com atendente', response: 'Já chamo alguém para te ajudar!', handoff: true },
      ],
      aiEnabled: true,
      enabled: true,
    },
  });
  log.info({ phoneNumberId, customerId: customer.id }, 'config do chatbot vinculada ao cliente');

  // 2) Conversas de EXEMPLO — só cria se ainda não houver nenhuma para o número.
  const existing = await prisma.whatsappConversation.count({ where: { phoneNumberId } });
  if (existing > 0) {
    log.info({ existing }, 'já existem conversas — pulando os exemplos');
    return;
  }

  const now = Date.now();
  const min = (m: number) => new Date(now - m * 60_000);

  const demos = [
    {
      contactName: 'Maria Souza (exemplo)',
      contactPhone: '5511990001111',
      mode: 'BOT' as const,
      lastInboundAt: min(8),
      lastOutboundAt: min(7),
      messages: [
        { direction: 'INBOUND' as const, text: 'Oi, vocês estão abertos?', createdAt: min(9) },
        { direction: 'OUTBOUND' as const, text: 'Olá! 👋 Obrigado por chamar a gente.\n\nComo posso te ajudar? Responda com o número:\n1. Horário de funcionamento\n2. Endereço\n3. Falar com atendente', createdAt: min(9) },
        { direction: 'INBOUND' as const, text: '1', createdAt: min(8) },
        { direction: 'OUTBOUND' as const, text: 'Seg a sex, 9h às 18h. Sábado, 9h às 13h.', createdAt: min(7) },
      ],
    },
    {
      contactName: 'João Pereira (exemplo)',
      contactPhone: '5511990002222',
      mode: 'HUMAN' as const,
      lastInboundAt: min(25),
      lastOutboundAt: min(24),
      messages: [
        { direction: 'INBOUND' as const, text: 'Quero falar com um atendente, por favor', createdAt: min(25) },
        { direction: 'OUTBOUND' as const, text: 'Certo! Vou chamar um atendente para continuar com você. 🙌', createdAt: min(24) },
      ],
    },
    {
      contactName: 'Ana Lima (exemplo)',
      contactPhone: '5511990003333',
      mode: 'CLOSED' as const,
      lastInboundAt: min(120),
      lastOutboundAt: min(119),
      messages: [
        { direction: 'INBOUND' as const, text: 'Muito obrigada pelo atendimento!', createdAt: min(120) },
        { direction: 'OUTBOUND' as const, text: 'Nós que agradecemos! Qualquer coisa, é só chamar. 🙏', createdAt: min(119) },
      ],
    },
  ];

  for (const d of demos) {
    await prisma.whatsappConversation.create({
      data: {
        phoneNumberId,
        contactPhone: d.contactPhone,
        contactName: d.contactName,
        mode: d.mode,
        lastInboundAt: d.lastInboundAt,
        lastOutboundAt: d.lastOutboundAt,
        messages: {
          create: d.messages.map((m) => ({
            direction: m.direction,
            kind: 'text',
            text: m.text,
            createdAt: m.createdAt,
          })),
        },
      },
    });
  }
  log.info({ count: demos.length }, 'conversas de exemplo criadas (marcadas como "(exemplo)")');
}

main()
  .then(() => {
    log.info('painel de demonstração pronto');
  })
  .catch((err) => {
    log.error({ err }, 'falha ao popular o painel de demonstração');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
