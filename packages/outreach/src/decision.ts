import { OutreachMode } from '@informatizou/shared';
import type { OutreachDecision } from '@informatizou/shared';

export interface OutreachDecisionInput {
  hasBusinessEmail: boolean;
  hasPhone: boolean;
  whatsappOptIn: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  suppressed: boolean;
  recentlyContacted: boolean;
  demoPublished: boolean;
  outreachMode: OutreachMode;
}

/**
 * Decide a elegibilidade e o canal de contato de um lead (spec §28).
 * O agente auxilia, mas NUNCA contorna supressão/opt-out/aprovação.
 */
export function decideOutreach(input: OutreachDecisionInput): OutreachDecision {
  const blockingReasons: string[] = [];
  if (input.suppressed) blockingReasons.push('contato na lista de supressão/opt-out');
  if (!input.demoPublished) blockingReasons.push('demonstração ainda não publicada');
  if (!input.hasBusinessEmail && !input.hasPhone) blockingReasons.push('sem contato válido');
  if (input.recentlyContacted) blockingReasons.push('já recebeu contato recentemente');

  const reasons: string[] = [];
  let recommendedChannel: OutreachDecision['recommendedChannel'];

  if (input.hasBusinessEmail && input.emailEnabled) {
    recommendedChannel = 'EMAIL';
    reasons.push('e-mail empresarial disponível');
  } else if (input.whatsappEnabled && input.whatsappOptIn) {
    recommendedChannel = 'WHATSAPP';
    reasons.push('WhatsApp oficial com opt-in');
  } else if (input.hasPhone) {
    recommendedChannel = 'PHONE';
    reasons.push('telefone disponível — contato manual');
  } else {
    recommendedChannel = 'MANUAL';
    reasons.push('sem canal automático — revisão manual');
  }

  const eligible = blockingReasons.length === 0;
  // Aprovação exigida a menos que o modo seja explicitamente automático.
  const requiresApproval = input.outreachMode !== OutreachMode.AUTOMATIC_WHEN_ALLOWED;

  return {
    eligible,
    recommendedChannel: eligible ? recommendedChannel : 'MANUAL',
    requiresApproval,
    reasons,
    blockingReasons,
  };
}
