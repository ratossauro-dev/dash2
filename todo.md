# Bot Dashboard - TODO

## Fase 1: Banco de Dados
- [x] Schema: tabela bots (id, name, type, status, last_heartbeat, config)
- [x] Schema: tabela bot_logs (id, bot_id, level, message, created_at)
- [x] Schema: tabela media_queue (id, source_url, category, source, status, target_channel, created_at)
- [x] Schema: tabela subscribers (id, telegram_id, name, plan, status, expires_at)
- [x] Schema: tabela payments (id, subscriber_id, amount, status, qr_code, tx_id, created_at)
- [x] Schema: tabela social_accounts (id, platform, username, password_enc, status, created_at)
- [x] Schema: tabela bot_prompts (id, bot_name, description, prompt_text, version, created_at)
- [x] Schema: tabela notifications (id, type, title, message, read, created_at)
- [x] Aplicar migrations via webdev_execute_sql

## Fase 2: Backend (tRPC)
- [x] Router bots: list, getById, updateStatus, heartbeat, getLogs, create
- [x] Router mediaQueue: list, add, updateStatus, getStats
- [x] Router subscribers: list, upsert, getStats
- [x] Router payments: list, create, updateStatus, getStats
- [x] Router socialAccounts: list, add, updateStatus
- [x] Router botPrompts: list, upsert
- [x] Router notifications: list, markRead, markAllRead, create
- [x] Router llm: chat (assistente com contexto do sistema)
- [x] Router stats: overview (resumo geral para o dashboard)

## Fase 3: Layout e Estética Cyberpunk
- [x] Configurar tema cyberpunk no index.css (preto, rosa neon, ciano elétrico)
- [x] Criar CyberpunkLayout com sidebar e header
- [x] Sidebar com navegação para todas as seções
- [x] Header com status geral e notificações
- [x] Efeitos de neon (glow, scanlines, HUD corners)
- [x] Fontes geométricas (Orbitron, Share Tech Mono)

## Fase 4: Páginas Principais
- [x] Página Home/Overview: cards de status, gráficos, atividade recente
- [x] Página Bots: lista de bots com status em tempo real, logs, controles
- [x] Página Mídias: fila de mídias, categorias, estatísticas
- [x] Página Assinantes: lista de assinantes, planos, expiração
- [x] Página Pagamentos: histórico, QR codes, estatísticas de receita
- [x] Página Contas Sociais: contas X e Instagram criadas
- [x] Página Configurações: tokens, canais, configurações dos bots

## Fase 5: Funcionalidades Avançadas
- [x] Assistente LLM integrado (chat com contexto do sistema)
- [x] Página de Prompts: documentação completa de todos os 8 bots
- [x] Sistema de notificações in-app (bell icon, dropdown)
- [x] Notificação automática ao owner quando bot cai
- [x] Auto-refresh de dados a cada 30 segundos
- [x] Filtros e busca em todas as listas

## Fase 6: Testes e Entrega
- [x] Testes Vitest para routers principais (14 testes passando)
- [x] Checkpoint final

## Pendente / Futuro
- [ ] Integração real com API Sync Pay (aguardando aprovação)
- [ ] Webhook endpoint para confirmação de pagamentos PIX
- [ ] Integração com API do Telegram para envio real de mídias
- [ ] Sistema de backup automático em S3
- [ ] Exportar prompts como arquivo .txt/.md para regeneração offline

## Sistema de API Tokens (integração bots externos)
- [ ] Schema: tabela api_tokens (id, bot_id, token, name, last_used, created_at)
- [ ] Migration aplicada
- [ ] Endpoints públicos com autenticação por Bearer token: POST /api/bot/heartbeat, POST /api/bot/log, POST /api/bot/status, POST /api/bot/media
- [ ] Página de gerenciamento de tokens na dash (gerar, revogar, copiar)
- [ ] Prompts atualizados com código Python completo de integração (classe DashboardClient)
- [x] Ajustar hospedagem dos prompts: Discloud para bots leves, VPS apenas para Erome (BeautifulSoup/requests pesado) e Playwright
- [x] Atualizar prompt Bot Criador de Contas: X usa 5sim.net para SMS, Instagram usa temp-mail.org (se pedir número, aborta e avisa na dash)
- [x] Exibir ID do bot na página Bots e API Tokens para facilitar configuração do .env
- [x] Corrigir roteamento /api/bot/* no Express para retornar JSON (não HTML)
- [ ] Corrigir travamento das rotas POST /api/bot/* (timeout no banco de dados)
