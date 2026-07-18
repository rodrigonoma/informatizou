/** Formata centavos em BRL. */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ProposalItemView {
  name: string;
  description?: string;
  priceCents: number;
  quantity: number;
}

export interface ProposalView {
  businessName: string;
  responsibleName?: string;
  description?: string;
  scope?: string;
  implementationCents?: number;
  monthlyCents?: number;
  deadline?: string;
  conditions?: string;
  validUntil?: string;
  includedItems: string[];
  excludedItems: string[];
  items: ProposalItemView[];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Gera o HTML da proposta comercial (spec §32). Inclui dados da Informatizou,
 * escopo, valores, condições, validade e itens incluídos/não incluídos.
 */
export function buildProposalHtml(p: ProposalView): string {
  const items = p.items
    .map(
      (it) =>
        `<tr><td>${esc(it.name)}${it.description ? `<br><small>${esc(it.description)}</small>` : ''}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatBRL(it.priceCents)}</td></tr>`,
    )
    .join('');
  const included = p.includedItems.map((i) => `<li>${esc(i)}</li>`).join('');
  const excluded = p.excludedItems.map((i) => `<li>${esc(i)}</li>`).join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta — ${esc(p.businessName)}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;color:#1f2937;max-width:820px;margin:0 auto;padding:40px;line-height:1.5}
  .brand{display:flex;align-items:center;gap:10px;border-bottom:3px solid #1f47f5;padding-bottom:16px}
  .brand .logo{width:44px;height:44px;border-radius:10px;background:#1f47f5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px}
  h1{font-size:24px;margin:24px 0 4px} h2{font-size:16px;margin:28px 0 8px;color:#1f47f5}
  .muted{color:#6b7280} table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;font-size:14px}
  .values{display:flex;gap:16px;margin-top:8px}
  .value-box{flex:1;background:#f7f9fc;border-radius:12px;padding:16px}
  .value-box .n{font-size:22px;font-weight:800} ul{margin:6px 0;padding-left:20px}
  footer{margin-top:40px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px;color:#6b7280}
</style></head><body>
  <div class="brand"><div class="logo">I</div><div><strong>Informatizou</strong><br><span class="muted">www.informatizou.com.br</span></div></div>
  <h1>Proposta comercial</h1>
  <p class="muted">Para: <strong>${esc(p.businessName)}</strong>${p.responsibleName ? ` · ${esc(p.responsibleName)}` : ''}</p>
  ${p.description ? `<p>${esc(p.description)}</p>` : ''}
  ${p.scope ? `<h2>Escopo</h2><p>${esc(p.scope)}</p>` : ''}
  <h2>Valores</h2>
  <div class="values">
    <div class="value-box"><div class="muted">Implantação</div><div class="n">${p.implementationCents != null ? formatBRL(p.implementationCents) : '—'}</div><div class="muted">pagamento único</div></div>
    <div class="value-box"><div class="muted">Manutenção</div><div class="n">${p.monthlyCents != null ? formatBRL(p.monthlyCents) : '—'}</div><div class="muted">por mês</div></div>
  </div>
  ${p.items.length ? `<h2>Itens</h2><table><thead><tr><th>Item</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor</th></tr></thead><tbody>${items}</tbody></table>` : ''}
  ${included ? `<h2>Incluído</h2><ul>${included}</ul>` : ''}
  ${excluded ? `<h2>Não incluído</h2><ul>${excluded}</ul>` : ''}
  ${p.deadline ? `<h2>Prazo</h2><p>${esc(p.deadline)}</p>` : ''}
  ${p.conditions ? `<h2>Condições</h2><p>${esc(p.conditions)}</p>` : ''}
  ${p.validUntil ? `<p class="muted">Proposta válida até ${esc(p.validUntil)}.</p>` : ''}
  <footer>Informatizou · Criação, hospedagem e manutenção de sites · www.informatizou.com.br</footer>
</body></html>`;
}
