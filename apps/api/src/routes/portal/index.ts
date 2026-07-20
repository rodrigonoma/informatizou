import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { OAuth2Client } from 'google-auth-library';
import { loadEnv } from '@informatizou/config';
import {
  hashPassword,
  verifyPassword,
  signPortalToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@informatizou/auth';
import { getWhatsAppProvider, getEmailProvider } from '@informatizou/providers';
import type { Customer } from '@informatizou/database';
import { apiEnv } from '../../config.js';
import { botConfigFields, buildBotConfigData } from '../whatsapp/config-shared.js';

const REFRESH_COOKIE = 'portal_refresh';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

/** HTML do e-mail de redefinição de senha do painel. */
function resetEmailHtml(name: string, link: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a">
    <h2 style="color: #000080">Redefinição de senha</h2>
    <p>Olá, ${name.split(' ')[0] || name}!</p>
    <p>Recebemos um pedido para redefinir a senha do seu Painel Informatizou.
       Clique no botão abaixo para criar uma nova senha (o link expira em 1 hora):</p>
    <p style="text-align: center; margin: 28px 0">
      <a href="${link}" style="background: #000080; color: #fff; text-decoration: none;
         padding: 12px 22px; border-radius: 8px; font-weight: bold">Redefinir minha senha</a>
    </p>
    <p style="font-size: 13px; color: #555">Se você não fez este pedido, ignore este e-mail — sua senha continua a mesma.</p>
    <p style="font-size: 12px; color: #888">Ou copie e cole este endereço: ${link}</p>
  </div>`;
}

function setRefreshCookie(reply: FastifyReply, token: string): void {
  const env = apiEnv();
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/portal',
    maxAge: REFRESH_TTL_MS / 1000,
    signed: false,
  });
}

function toPublicCustomer(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    portalEmail: c.portalEmail,
    lastPortalLoginAt: c.lastPortalLoginAt ? c.lastPortalLoginAt.toISOString() : null,
  };
}

/**
 * Painel do cliente (área logada do negócio): o dono configura o chatbot,
 * acompanha conversas e relatórios e vê os sites criados para ele.
 * Token isolado (kind='customer'); todo dado é escopado ao próprio cliente.
 */
export async function portalRoutes(app: FastifyInstance): Promise<void> {
  const env = apiEnv();
  const p = app.prisma;
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { preHandler: [app.authenticateCustomer] };

  const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

  // Cria a sessão (refresh httpOnly) e devolve o access token do painel.
  async function startSession(
    customer: Customer,
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<string> {
    const session = await p.customerSession.create({
      data: {
        customerId: customer.id,
        refreshTokenHash: '',
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
    const accessToken = signPortalToken(
      { sub: customer.id, email: customer.portalEmail! },
      env.JWT_SECRET,
    );
    const refreshToken = signRefreshToken({ sub: customer.id, sid: session.id }, env.JWT_REFRESH_SECRET);
    await p.customerSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: sha256(refreshToken) },
    });
    setRefreshCookie(reply, refreshToken);
    return accessToken;
  }

  // POST /portal/auth/login
  r.post(
    '/auth/login',
    { schema: { tags: ['portal'], summary: 'Login do painel do cliente', body: loginSchema } },
    async (req, reply) => {
      const email = req.body.email.trim().toLowerCase();
      const customer = await p.customer.findUnique({ where: { portalEmail: email } });
      if (!customer || customer.deletedAt || !customer.passwordHash) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'credenciais inválidas' });
      }
      const ok = await verifyPassword(customer.passwordHash, req.body.password);
      if (!ok) {
        app.log.warn({ email }, 'login do painel falhou');
        return reply.code(401).send({ error: 'Unauthorized', message: 'credenciais inválidas' });
      }
      const accessToken = await startSession(customer, req, reply);
      const updated = await p.customer.update({
        where: { id: customer.id },
        data: { lastPortalLoginAt: new Date() },
      });
      return { accessToken, customer: toPublicCustomer(updated) };
    },
  );

  // POST /portal/auth/register — o próprio negócio cria a conta do painel.
  r.post(
    '/auth/register',
    {
      schema: {
        tags: ['portal'],
        summary: 'Cria uma conta no painel do cliente',
        body: z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(8),
        }),
      },
    },
    async (req, reply) => {
      const email = req.body.email.trim().toLowerCase();
      const existing = await p.customer.findUnique({ where: { portalEmail: email } });
      if (existing) {
        return reply.code(409).send({ error: 'Conflict', message: 'Já existe uma conta com este e-mail.' });
      }
      const passwordHash = await hashPassword(req.body.password);
      const customer = await p.customer.create({
        data: {
          name: req.body.name.trim(),
          email,
          portalEmail: email,
          passwordHash,
          lastPortalLoginAt: new Date(),
        },
      });
      const accessToken = await startSession(customer, req, reply);
      return reply.code(201).send({ accessToken, customer: toPublicCustomer(customer) });
    },
  );

  // POST /portal/auth/google — login social (Google Identity Services).
  r.post(
    '/auth/google',
    {
      schema: {
        tags: ['portal'],
        summary: 'Login com Google',
        body: z.object({ credential: z.string().min(10) }),
      },
    },
    async (req, reply) => {
      const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
      if (!clientId) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Login com Google não está configurado.' });
      }
      const client = new OAuth2Client(clientId);
      let payload;
      try {
        const ticket = await client.verifyIdToken({ idToken: req.body.credential, audience: clientId });
        payload = ticket.getPayload();
      } catch {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Não foi possível validar o login do Google.' });
      }
      if (!payload?.email || payload.email_verified === false) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Conta Google sem e-mail verificado.' });
      }
      const email = payload.email.trim().toLowerCase();
      let customer = await p.customer.findUnique({ where: { portalEmail: email } });
      if (customer?.deletedAt) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'conta indisponível' });
      }
      if (!customer) {
        customer = await p.customer.create({
          data: { name: payload.name ?? email, email, portalEmail: email, lastPortalLoginAt: new Date() },
        });
      } else {
        customer = await p.customer.update({
          where: { id: customer.id },
          data: { lastPortalLoginAt: new Date() },
        });
      }
      const accessToken = await startSession(customer, req, reply);
      return { accessToken, customer: toPublicCustomer(customer) };
    },
  );

  // POST /portal/auth/forgot — envia link de redefinição (resposta neutra).
  r.post(
    '/auth/forgot',
    {
      schema: {
        tags: ['portal'],
        summary: 'Solicita redefinição de senha',
        body: z.object({ email: z.string().email() }),
      },
    },
    async (req) => {
      const email = req.body.email.trim().toLowerCase();
      const customer = await p.customer.findUnique({ where: { portalEmail: email } });
      // Sempre responde 200 — não revela se o e-mail existe (anti-enumeração).
      if (!customer || customer.deletedAt) return { ok: true };

      const rawToken = randomBytes(32).toString('hex');
      await p.portalPasswordReset.create({
        data: {
          customerId: customer.id,
          tokenHash: sha256(rawToken),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      const link = `${env.APP_BASE_URL.replace(/\/$/, '')}/painel/redefinir?token=${rawToken}`;
      const provider = getEmailProvider({
        EMAIL_PROVIDER: env.EMAIL_PROVIDER,
        ENABLE_EMAIL_DELIVERY: env.ENABLE_EMAIL_DELIVERY,
        SMTP_HOST: env.SMTP_HOST,
        SMTP_PORT: env.SMTP_PORT,
        SMTP_USER: env.SMTP_USER,
        SMTP_PASSWORD: env.SMTP_PASSWORD,
        SMTP_FROM_NAME: env.SMTP_FROM_NAME,
        SMTP_FROM_EMAIL: env.SMTP_FROM_EMAIL,
      });
      try {
        await provider.send({
          to: email,
          subject: 'Redefinição de senha — Painel Informatizou',
          html: resetEmailHtml(customer.name, link),
          text: `Para redefinir a senha do seu painel, acesse: ${link}`,
        });
      } catch (err) {
        req.log.warn({ err: (err as Error).message }, 'não foi possível enviar e-mail de redefinição');
      }
      // Em dev/homologação (sem SMTP), devolve o link para facilitar o teste.
      return env.NODE_ENV === 'production' ? { ok: true } : { ok: true, devLink: link };
    },
  );

  // POST /portal/auth/reset — define nova senha com o token do e-mail.
  r.post(
    '/auth/reset',
    {
      schema: {
        tags: ['portal'],
        summary: 'Redefine a senha com o token',
        body: z.object({ token: z.string().min(10), password: z.string().min(8) }),
      },
    },
    async (req, reply) => {
      const reset = await p.portalPasswordReset.findUnique({
        where: { tokenHash: sha256(req.body.token) },
      });
      if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Link inválido ou expirado.' });
      }
      const passwordHash = await hashPassword(req.body.password);
      await p.customer.update({ where: { id: reset.customerId }, data: { passwordHash } });
      await p.portalPasswordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
      // Revoga sessões existentes por segurança.
      await p.customerSession.updateMany({
        where: { customerId: reset.customerId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { ok: true };
    },
  );

  // POST /portal/auth/refresh
  r.post(
    '/auth/refresh',
    { schema: { tags: ['portal'], summary: 'Renova o token do painel' } },
    async (req, reply) => {
      const token = req.cookies[REFRESH_COOKIE];
      if (!token) return reply.code(401).send({ error: 'Unauthorized', message: 'refresh ausente' });
      let payload;
      try {
        payload = verifyRefreshToken(token, env.JWT_REFRESH_SECRET);
      } catch {
        return reply.code(401).send({ error: 'Unauthorized', message: 'refresh inválido' });
      }
      const session = await p.customerSession.findUnique({ where: { id: payload.sid } });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt.getTime() < Date.now() ||
        session.refreshTokenHash !== sha256(token)
      ) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'sessão inválida' });
      }
      const customer = await p.customer.findUnique({ where: { id: payload.sub } });
      if (!customer || customer.deletedAt || !customer.portalEmail) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'cliente indisponível' });
      }

      await p.customerSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      const newSession = await p.customerSession.create({
        data: {
          customerId: customer.id,
          refreshTokenHash: '',
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          ip: req.ip,
          userAgent: req.headers['user-agent'] ?? null,
        },
      });
      const accessToken = signPortalToken(
        { sub: customer.id, email: customer.portalEmail },
        env.JWT_SECRET,
      );
      const newRefresh = signRefreshToken({ sub: customer.id, sid: newSession.id }, env.JWT_REFRESH_SECRET);
      await p.customerSession.update({
        where: { id: newSession.id },
        data: { refreshTokenHash: sha256(newRefresh) },
      });
      setRefreshCookie(reply, newRefresh);
      return { accessToken };
    },
  );

  // GET /portal/me
  r.get('/me', { ...guard, schema: { tags: ['portal'], summary: 'Cliente autenticado' } }, async (req, reply) => {
    const customer = await p.customer.findUnique({ where: { id: req.portalCustomer!.sub } });
    if (!customer || customer.deletedAt) return reply.code(401).send({ error: 'Unauthorized' });
    return toPublicCustomer(customer);
  });

  // POST /portal/auth/logout
  r.post('/auth/logout', { schema: { tags: ['portal'], summary: 'Encerra a sessão do painel' } }, async (req, reply) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = verifyRefreshToken(token, env.JWT_REFRESH_SECRET);
        await p.customerSession.updateMany({
          where: { id: payload.sid, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch {
        // token inválido — apenas limpa o cookie.
      }
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/portal' });
    return reply.code(204).send();
  });

  // ---- helpers escopados ao cliente ----
  const myPhoneIds = async (customerId: string): Promise<string[]> => {
    const configs = await p.whatsappBotConfig.findMany({
      where: { customerId },
      select: { phoneNumberId: true },
    });
    return configs.map((c) => c.phoneNumberId);
  };
  const ownsConversation = async (customerId: string, conversationId: string) => {
    const conv = await p.whatsappConversation.findUnique({ where: { id: conversationId } });
    if (!conv) return null;
    const ids = await myPhoneIds(customerId);
    return ids.includes(conv.phoneNumberId) ? conv : null;
  };

  // GET /portal/whatsapp/config — configs do próprio cliente
  r.get(
    '/whatsapp/config',
    { ...guard, schema: { tags: ['portal'], summary: 'Config do chatbot do cliente' } },
    (req) =>
      p.whatsappBotConfig.findMany({
        where: { customerId: req.portalCustomer!.sub },
        orderBy: { createdAt: 'desc' },
      }),
  );

  // PUT /portal/whatsapp/config/:phoneNumberId — só edita número já atribuído a ele
  r.put(
    '/whatsapp/config/:phoneNumberId',
    {
      ...guard,
      schema: {
        tags: ['portal'],
        summary: 'Atualiza a config do chatbot do cliente',
        params: z.object({ phoneNumberId: z.string().min(1) }),
        body: z.object(botConfigFields),
      },
    },
    async (req, reply) => {
      const existing = await p.whatsappBotConfig.findUnique({
        where: { phoneNumberId: req.params.phoneNumberId },
      });
      if (!existing || existing.customerId !== req.portalCustomer!.sub) {
        return reply.code(404).send({ error: 'Not Found', message: 'número não encontrado' });
      }
      return p.whatsappBotConfig.update({
        where: { phoneNumberId: req.params.phoneNumberId },
        data: buildBotConfigData(req.body),
      });
    },
  );

  // GET /portal/whatsapp/conversations
  r.get(
    '/whatsapp/conversations',
    { ...guard, schema: { tags: ['portal'], summary: 'Conversas do cliente' } },
    async (req) => {
      const ids = await myPhoneIds(req.portalCustomer!.sub);
      if (!ids.length) return [];
      return p.whatsappConversation.findMany({
        where: { phoneNumberId: { in: ids } },
        orderBy: { lastInboundAt: 'desc' },
        take: 50,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
    },
  );

  const idParam = z.object({ id: z.string().min(1) });

  r.get(
    '/whatsapp/conversations/:id',
    { ...guard, schema: { tags: ['portal'], summary: 'Conversa + histórico', params: idParam } },
    async (req, reply) => {
      const owned = await ownsConversation(req.portalCustomer!.sub, req.params.id);
      if (!owned) return reply.code(404).send({ error: 'Not Found' });
      return p.whatsappConversation.findUnique({
        where: { id: req.params.id },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
      });
    },
  );

  const setMode =
    (mode: 'HUMAN' | 'BOT' | 'CLOSED') => async (req: { params: { id: string }; portalCustomer?: { sub: string } }, reply: FastifyReply) => {
      const owned = await ownsConversation(req.portalCustomer!.sub, req.params.id);
      if (!owned) return reply.code(404).send({ error: 'Not Found' });
      return p.whatsappConversation.update({ where: { id: req.params.id }, data: { mode } });
    };

  r.post('/whatsapp/conversations/:id/takeover', { ...guard, schema: { tags: ['portal'], summary: 'Assumir', params: idParam } }, setMode('HUMAN'));
  r.post('/whatsapp/conversations/:id/return', { ...guard, schema: { tags: ['portal'], summary: 'Devolver ao bot', params: idParam } }, setMode('BOT'));
  r.post('/whatsapp/conversations/:id/close', { ...guard, schema: { tags: ['portal'], summary: 'Encerrar', params: idParam } }, setMode('CLOSED'));

  // POST /portal/whatsapp/conversations/:id/reply — resposta manual do dono
  r.post(
    '/whatsapp/conversations/:id/reply',
    {
      ...guard,
      schema: {
        tags: ['portal'],
        summary: 'Responder manualmente',
        params: idParam,
        body: z.object({ text: z.string().min(1).max(4096) }),
      },
    },
    async (req, reply) => {
      const conv = await ownsConversation(req.portalCustomer!.sub, req.params.id);
      if (!conv) return reply.code(404).send({ error: 'Not Found' });

      const wenv = loadEnv();
      const provider = getWhatsAppProvider({
        WHATSAPP_PROVIDER: wenv.WHATSAPP_PROVIDER,
        ENABLE_WHATSAPP_DELIVERY: wenv.ENABLE_WHATSAPP_DELIVERY,
        WHATSAPP_ACCESS_TOKEN: wenv.WHATSAPP_ACCESS_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: wenv.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_API_VERSION: wenv.WHATSAPP_API_VERSION,
      });
      let providerMessageId: string | undefined;
      let delivered = false;
      if (provider.canSend()) {
        const sent = await provider.send({ to: conv.contactPhone, body: req.body.text });
        providerMessageId = sent.providerMessageId;
        delivered = true;
      }
      const msg = await p.whatsappMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'OUTBOUND',
          waMessageId: providerMessageId ?? null,
          kind: 'text',
          text: req.body.text,
        },
      });
      await p.whatsappConversation.update({
        where: { id: conv.id },
        data: { lastOutboundAt: new Date(), mode: conv.mode === 'BOT' ? 'HUMAN' : conv.mode },
      });
      return { delivered, message: msg };
    },
  );

  // GET /portal/reports — visão geral do atendimento
  r.get('/reports', { ...guard, schema: { tags: ['portal'], summary: 'Relatórios do cliente' } }, async (req) => {
    const cid = req.portalCustomer!.sub;
    const ids = await myPhoneIds(cid);
    const empty = {
      conversations: { total: 0, bot: 0, human: 0, closed: 0 },
      messages30d: { inbound: 0, outbound: 0 },
      sites: 0,
    };
    const sites = await p.customerSite.count({ where: { customerId: cid } });
    if (!ids.length) return { ...empty, sites };

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const convWhere = { phoneNumberId: { in: ids } };
    const [total, bot, human, closed, inbound, outbound] = await Promise.all([
      p.whatsappConversation.count({ where: convWhere }),
      p.whatsappConversation.count({ where: { ...convWhere, mode: 'BOT' } }),
      p.whatsappConversation.count({ where: { ...convWhere, mode: 'HUMAN' } }),
      p.whatsappConversation.count({ where: { ...convWhere, mode: 'CLOSED' } }),
      p.whatsappMessage.count({
        where: { direction: 'INBOUND', createdAt: { gte: since }, conversation: { is: convWhere } },
      }),
      p.whatsappMessage.count({
        where: { direction: 'OUTBOUND', createdAt: { gte: since }, conversation: { is: convWhere } },
      }),
    ]);
    return {
      conversations: { total, bot, human, closed },
      messages30d: { inbound, outbound },
      sites,
    };
  });

  // GET /portal/sites — sites criados para o negócio do cliente
  r.get('/sites', { ...guard, schema: { tags: ['portal'], summary: 'Sites do cliente' } }, (req) =>
    p.customerSite.findMany({
      where: { customerId: req.portalCustomer!.sub },
      orderBy: { createdAt: 'desc' },
    }),
  );
}

/** Rota interna (operador) para conceder acesso ao painel a um cliente. */
export async function portalAdminRoutes(app: FastifyInstance): Promise<void> {
  const p = app.prisma;
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { preHandler: [app.authenticate, app.authorize('integrations.configure')] };

  r.post(
    '/grant',
    {
      ...guard,
      schema: {
        tags: ['portal-admin'],
        summary: 'Concede/atualiza acesso ao painel de um cliente',
        body: z.object({
          customerId: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(8),
          phoneNumberId: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { customerId, email, password, phoneNumberId } = req.body;
      const customer = await p.customer.findUnique({ where: { id: customerId } });
      if (!customer || customer.deletedAt) {
        return reply.code(404).send({ error: 'Not Found', message: 'cliente não encontrado' });
      }
      const passwordHash = await hashPassword(password);
      await p.customer.update({
        where: { id: customerId },
        data: { portalEmail: email.trim().toLowerCase(), passwordHash },
      });
      // Atribui o número de WhatsApp (se informado e existente) a este cliente.
      if (phoneNumberId) {
        await p.whatsappBotConfig.updateMany({ where: { phoneNumberId }, data: { customerId } });
      }
      return { ok: true };
    },
  );
}
