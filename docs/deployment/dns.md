# DNS (spec §43)

Registros necessários apontando para o IP da VPS (`IP_DA_VPS`):

```text
A     @       IP_DA_VPS
A     www     IP_DA_VPS
A     app     IP_DA_VPS
A     api     IP_DA_VPS
A     demo    IP_DA_VPS
```

Mapeamento de subdomínios (Nginx):

| Subdomínio | Serviço |
|------------|---------|
| www.informatizou.com.br | public-web (site institucional) |
| app.informatizou.com.br | admin-web (painel) |
| api.informatizou.com.br | api (REST + Swagger em /docs) |
| demo.informatizou.com.br | demo-renderer (demonstrações, sempre noindex) |

Wildcard (opcional, não exigido no MVP):

```text
A     *.demo  IP_DA_VPS
```

> As demonstrações ficam em `demo.informatizou.com.br/{slug}` (subdomínio dedicado),
> nunca na raiz de `www`, para separar segurança, certificados, expiração, cache e
> controle de indexação (§3).
