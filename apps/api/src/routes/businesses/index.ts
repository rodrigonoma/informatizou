import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { parseBusinessesCsv } from '@informatizou/search-providers';
import { normalizeName, toE164 } from '@informatizou/shared';
import { writeAudit } from '../../hooks/audit.js';

/** Rotas de empresas (spec §35). */
export async function businessRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET /businesses
  r.get(
    '/businesses',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['businesses'],
        summary: 'Lista empresas',
        querystring: z.object({
          campaignId: z.string().optional(),
          city: z.string().optional(),
          hasWebsite: z.enum(['true', 'false']).optional(),
          take: z.coerce.number().int().min(1).max(100).default(50),
          skip: z.coerce.number().int().min(0).default(0),
        }),
      },
    },
    async (request) => {
      const { campaignId, city, hasWebsite, take, skip } = request.query;
      const where = {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(city ? { city } : {}),
        ...(hasWebsite === 'true'
          ? { website: { not: null } }
          : hasWebsite === 'false'
            ? { website: null }
            : {}),
      };
      const [items, total] = await Promise.all([
        app.prisma.business.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: { contacts: true, socialProfiles: true },
        }),
        app.prisma.business.count({ where }),
      ]);
      return { items, total };
    },
  );

  // GET /businesses/:id
  r.get(
    '/businesses/:id',
    {
      preHandler: [app.authenticate, app.authorize('view')],
      schema: {
        tags: ['businesses'],
        summary: 'Detalha empresa',
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const business = await app.prisma.business.findUnique({
        where: { id: request.params.id },
        include: {
          contacts: true,
          socialProfiles: true,
          sourceRecords: true,
          websiteVerifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      if (!business || business.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      return business;
    },
  );

  // PATCH /businesses/:id
  r.patch(
    '/businesses/:id',
    {
      preHandler: [app.authenticate, app.authorize('data.review')],
      schema: {
        tags: ['businesses'],
        summary: 'Atualiza empresa',
        params: z.object({ id: z.string() }),
        body: z
          .object({
            name: z.string().optional(),
            phone: z.string().optional(),
            website: z.string().optional(),
            city: z.string().optional(),
            address: z.string().optional(),
          })
          .strict(),
      },
    },
    async (request, reply) => {
      const existing = await app.prisma.business.findUnique({ where: { id: request.params.id } });
      if (!existing || existing.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      const body = request.body;
      const updated = await app.prisma.business.update({
        where: { id: request.params.id },
        data: {
          ...body,
          ...(body.name ? { normalizedName: normalizeName(body.name) } : {}),
          ...(body.phone ? { phoneE164: toE164(body.phone).e164 } : {}),
          updatedBy: request.authUser?.sub ?? null,
        },
      });
      return updated;
    },
  );

  // POST /businesses/import  (CSV)
  r.post(
    '/businesses/import',
    {
      preHandler: [app.authenticate, app.authorize('campaigns.create')],
      schema: {
        tags: ['businesses'],
        summary: 'Importa empresas via CSV',
        body: z.object({
          csv: z.string().min(1),
          campaignId: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { csv, campaignId } = request.body;
      const parsed = parseBusinessesCsv(csv);
      let imported = 0;
      for (const b of parsed) {
        const phoneParsed = b.phone ? toE164(b.phone) : null;
        await app.prisma.business.upsert({
          where: { source_externalId: { source: b.source, externalId: b.externalId } },
          update: { name: b.name, normalizedName: normalizeName(b.name), campaignId: campaignId ?? undefined },
          create: {
            externalId: b.externalId,
            source: b.source,
            name: b.name,
            normalizedName: normalizeName(b.name),
            category: b.category ?? null,
            categories: b.categories,
            city: b.city ?? null,
            state: b.state ?? null,
            phone: b.phone ?? null,
            phoneE164: phoneParsed?.e164 ?? null,
            website: b.website ?? null,
            rating: b.rating ?? null,
            reviewCount: b.reviewCount ?? null,
            rawData: b.rawData as object,
            campaignId: campaignId ?? null,
            createdBy: request.authUser?.sub ?? null,
          },
        });
        imported += 1;
      }
      await writeAudit(app.prisma, {
        userId: request.authUser?.sub,
        action: 'business.import_csv',
        entityType: 'Business',
        after: { imported },
      });
      return reply.code(201).send({ imported });
    },
  );

  // POST /businesses/:id/reverify (enfileira reverificação — Fase 3)
  r.post(
    '/businesses/:id/reverify',
    {
      preHandler: [app.authenticate, app.authorize('data.review')],
      schema: {
        tags: ['businesses'],
        summary: 'Reenfileira verificação de site (Fase 3)',
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const business = await app.prisma.business.findUnique({ where: { id: request.params.id } });
      if (!business || business.deletedAt) return reply.code(404).send({ error: 'Not Found' });
      // Enfileiramento real da verificação chega na Fase 3.
      return reply.code(202).send({ status: 'accepted', note: 'verificação implementada na Fase 3' });
    },
  );
}
