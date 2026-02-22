# Bot Dashboard — Notas de Deploy

## Arquitetura Atual

| Componente | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | https://dash2-hfp7.vercel.app |
| Backend | Render | https://bot-dashboard-backend-xqp9.onrender.com |
| Repositório | GitHub | https://github.com/ratossauro-dev/dash2 (branch main) |

## Render — Configurações

- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `node dist/index.js`
- **Plano:** Free (hiberna após 15min, ~30s para acordar)

### Variáveis de Ambiente (Render)
- `DASHBOARD_PASSWORD` = `123`
- `OWNER_OPEN_ID` = `admin`
- `NODE_ENV` = `production`
- `DATABASE_URL` = *(configurado no Render)*

## Vercel — Proxy
O `vercel.json` faz proxy de `/api/*` para o Render. Auto-deploy a cada push.

## Acesso
- Sem login — abre direto como admin
- Push no GitHub atualiza Vercel + Render automaticamente

## Arquivos Importantes Modificados
- `server/_core/sdk.ts` — auto-autentica como admin
- `server/_core/static.ts` — resolução resiliente de caminhos
- `server/_core/index.ts` — removido Vite dev do bundle de produção
- `client/src/components/CyberpunkLayout.tsx` — removida tela de login
- `vercel.json` — proxy API para Render
- `package.json` — build:server corrigido
