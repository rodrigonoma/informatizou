import type { Job } from 'bullmq';
import PDFDocument from 'pdfkit';
import { prisma } from '@informatizou/database';
import { buildProposalHtml, formatBRL, type ProposalView } from '@informatizou/proposals';
import { createStorageService } from '@informatizou/storage';
import { loadEnv } from '@informatizou/config';
import { createLogger, withCorrelation } from '@informatizou/logging';

const baseLog = createLogger({ name: 'proposal-generation' });

/** Renderiza a proposta em PDF (pdfkit) e retorna o buffer. */
function renderPdf(view: ProposalView): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1f47f5').fontSize(22).text('Informatizou', { continued: false });
    doc.moveDown(0.3).fillColor('#6b7280').fontSize(10).text('www.informatizou.com.br');
    doc.moveDown(1).fillColor('#111827').fontSize(18).text('Proposta comercial');
    doc.moveDown(0.5).fontSize(12).fillColor('#374151').text(`Para: ${view.businessName}`);
    if (view.description) doc.moveDown(0.5).text(view.description);
    if (view.scope) {
      doc.moveDown(1).fillColor('#1f47f5').fontSize(13).text('Escopo');
      doc.fillColor('#374151').fontSize(11).text(view.scope);
    }
    doc.moveDown(1).fillColor('#1f47f5').fontSize(13).text('Valores');
    doc.fillColor('#111827').fontSize(12);
    doc.text(`Implantação: ${view.implementationCents != null ? formatBRL(view.implementationCents) : '—'} (único)`);
    doc.text(`Manutenção: ${view.monthlyCents != null ? formatBRL(view.monthlyCents) : '—'} / mês`);
    if (view.includedItems.length) {
      doc.moveDown(1).fillColor('#1f47f5').fontSize(13).text('Incluído');
      doc.fillColor('#374151').fontSize(11);
      view.includedItems.forEach((i) => doc.text(`• ${i}`));
    }
    if (view.excludedItems.length) {
      doc.moveDown(0.6).fillColor('#1f47f5').fontSize(13).text('Não incluído');
      doc.fillColor('#374151').fontSize(11);
      view.excludedItems.forEach((i) => doc.text(`• ${i}`));
    }
    if (view.deadline) doc.moveDown(0.6).fillColor('#111827').text(`Prazo: ${view.deadline}`);
    if (view.conditions) doc.text(`Condições: ${view.conditions}`);
    if (view.validUntil) doc.moveDown(0.4).fillColor('#6b7280').fontSize(10).text(`Válida até ${view.validUntil}.`);
    doc.end();
  });
}

/** Gera HTML e PDF da proposta (spec §32) e armazena no MinIO. */
export async function proposalGenerationHandler(job: Job): Promise<unknown> {
  const proposalId = String(job.data?.proposalId ?? '');
  const env = loadEnv();
  const log = withCorrelation(baseLog, proposalId);

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      items: true,
      lead: { include: { business: { select: { name: true } } } },
      customer: { select: { name: true } },
    },
  });
  if (!proposal || proposal.deletedAt) return { skipped: true, reason: 'proposta inexistente' };

  const businessName = proposal.customer?.name ?? proposal.lead?.business.name ?? 'Cliente';
  const view: ProposalView = {
    businessName,
    description: proposal.description ?? undefined,
    scope: proposal.scope ?? undefined,
    implementationCents: proposal.implementationCents ?? undefined,
    monthlyCents: proposal.monthlyCents ?? undefined,
    deadline: proposal.deadline ?? undefined,
    conditions: proposal.conditions ?? undefined,
    validUntil: proposal.validUntil ? proposal.validUntil.toISOString().slice(0, 10) : undefined,
    includedItems: proposal.includedItems,
    excludedItems: proposal.excludedItems,
    items: proposal.items.map((i) => ({
      name: i.name,
      description: i.description ?? undefined,
      priceCents: i.priceCents,
      quantity: i.quantity,
    })),
  };

  const html = buildProposalHtml(view);
  const pdf = await renderPdf(view);

  const storage = createStorageService(env);
  let htmlUrl: string | null = null;
  let pdfUrl: string | null = null;
  try {
    await storage.ensureBucket();
    htmlUrl = await storage.putObject(`proposals/${proposal.id}.html`, html, 'text/html');
    pdfUrl = await storage.putObject(`proposals/${proposal.id}.pdf`, pdf, 'application/pdf');
  } catch (err) {
    log.error({ err }, 'falha ao armazenar proposta — mantendo apenas registro');
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { htmlUrl, pdfUrl },
  });

  log.info({ proposalId, htmlUrl, pdfUrl }, 'proposta gerada (HTML+PDF)');
  return { htmlUrl, pdfUrl };
}
