import { OutreachChannel } from '@informatizou/shared';

export type MessageVariant = 'BASE' | 'SHORT' | 'FOLLOW_UP' | 'REPLY_INTEREST' | 'REPLY_REJECTION';

export interface MessageInput {
  businessName: string;
  demoUrl: string;
  channel: OutreachChannel;
  variant: MessageVariant;
  expirationDays?: number;
}

export interface GeneratedMessage {
  subject?: string;
  body: string;
}

const INFORMATIZOU_EMAIL_FOOTER = [
  '',
  '—',
  'Informatizou',
  'Site oficial: https://www.informatizou.com.br',
  '',
  'Caso não queira receber novas mensagens, responda solicitando a remoção.',
].join('\n');

/** Mensagem-base (spec §26). */
function baseMessage(name: string, url: string, days: number): string {
  return `Olá! Tudo bem?

Encontrei a ${name} ao pesquisar estabelecimentos da região e percebi que vocês possuem uma boa presença online, mas não localizei um site institucional próprio.

Por isso, preparei sem compromisso uma demonstração personalizada de como o site da empresa poderia ficar:

${url}

A demonstração ficará disponível por ${days} dias para que vocês possam visualizar e avaliar com tranquilidade.

Caso gostem do projeto, podemos ajustar textos, fotos, domínio, WhatsApp e demais informações, além de colocar o site oficial no ar.

Também oferecemos um plano mensal opcional para hospedagem, manutenção, segurança, backups e atualizações.

Caso não tenham interesse, basta informar e não realizaremos novos contatos.`;
}

/** Mensagem curta (spec §26). */
function shortMessage(name: string, url: string, days: number): string {
  return `Olá! Preparei uma demonstração gratuita de site para a ${name}:

${url}

Ela ficará disponível por ${days} dias. É apenas uma proposta visual, sem compromisso, e ainda não representa o site oficial da empresa.

Caso gostem, podemos personalizar e publicar o site oficial, além de cuidar da hospedagem e manutenção mensal.

Se não houver interesse, é só me avisar.`;
}

function followUpMessage(name: string, url: string): string {
  return `Olá! Passando para saber se puderam ver a demonstração de site que preparei para a ${name}:

${url}

Sem compromisso — se fizer sentido, posso ajustar o que quiserem. Caso não haja interesse, é só avisar que não envio mais mensagens.`;
}

function replyInterest(name: string): string {
  return `Que ótimo saber do interesse da ${name}! Podemos avançar ajustando textos, fotos, domínio e WhatsApp, e colocar o site oficial no ar. Quando for melhor conversarmos sobre os próximos passos?`;
}

function replyRejection(name: string): string {
  return `Sem problemas! Agradeço o retorno da ${name}. Não enviaremos novos contatos. Se um dia precisarem de um site, estamos à disposição.`;
}

/**
 * Gera a mensagem comercial (spec §26). NÃO usa falsa urgência, alegação de
 * parceria/solicitação inexistente, promessa de vendas garantidas nem
 * informação inventada. E-mail inclui identificação e opção de remoção (§27).
 */
export function buildOutreachMessage(input: MessageInput): GeneratedMessage {
  const days = input.expirationDays ?? 10;
  let body: string;
  switch (input.variant) {
    case 'SHORT':
      body = shortMessage(input.businessName, input.demoUrl, days);
      break;
    case 'FOLLOW_UP':
      body = followUpMessage(input.businessName, input.demoUrl);
      break;
    case 'REPLY_INTEREST':
      body = replyInterest(input.businessName);
      break;
    case 'REPLY_REJECTION':
      body = replyRejection(input.businessName);
      break;
    case 'BASE':
    default:
      body = baseMessage(input.businessName, input.demoUrl, days);
      break;
  }

  if (input.channel === OutreachChannel.EMAIL) {
    return {
      subject: `Demonstração de site para a ${input.businessName}`,
      body: body + INFORMATIZOU_EMAIL_FOOTER,
    };
  }
  return { body };
}
