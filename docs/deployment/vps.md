# Deploy na VPS (Hostinger)

Guia para publicar o Informatizou Prospect em uma VPS Linux (Ubuntu LTS).

## 1. Pré-requisitos na VPS

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER   # relogar após isso
```

## 2. Código e variáveis

```bash
git clone https://github.com/rodrigonoma/informatizou.git
cd informatizou
cp .env.example .env
# Edite .env com segredos FORTES:
#   openssl rand -base64 48   → JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
# Configure domínios reais, DATABASE_URL, REDIS_URL internos, MINIO, provedores.
```

Variáveis críticas de produção:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:SENHA@postgres:5432/informatizou`
- `REDIS_URL=redis://redis:6379`
- `MINIO_ENDPOINT=http://minio:9000`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `POSTGRES_PASSWORD` (usado pelo compose de produção)
- Provedores pagos apenas quando desejar ativá-los (`ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`, SMTP..., WhatsApp oficial).
- `ENABLE_EMAIL_DELIVERY=true` só quando o SMTP estiver validado.
- `AUTONOMOUS_MODE=true` para operar ponta-a-ponta sem operador (respeitando os guardrails).

## 3. DNS

Configure os registros conforme [`dns.md`](./dns.md) apontando para o IP da VPS.

## 4. Subir o stack de produção

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Isso sobe: postgres, redis, minio, api, worker, admin-web, public-web, demo-renderer, nginx, certbot.
A migração (`prisma migrate deploy`) roda automaticamente no start da API.

## 5. Certificados SSL (primeira emissão)

```bash
docker compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d www.informatizou.com.br -d app.informatizou.com.br \
  -d api.informatizou.com.br -d demo.informatizou.com.br
docker compose -f docker-compose.production.yml restart nginx
```

O container `certbot` renova automaticamente a cada 12h.

## 6. Usuário administrador

O seed de desenvolvimento NÃO roda em produção. Crie o primeiro admin via `prisma studio`
ou um script pontual, e troque a senha imediatamente. Nunca use as credenciais de dev.

## 7. Verificação

```bash
curl https://api.informatizou.com.br/health          # {status:"ok"}
curl -I https://demo.informatizou.com.br/qualquer     # X-Robots-Tag: noindex...
```

## 8. Atualização

```bash
git pull
docker compose -f docker-compose.production.yml up -d --build
```
