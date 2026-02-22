import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Copy, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DASH_INTEGRATION_CODE = `
import requests, time

DASH_URL = "SUA_DASH_URL"  # Ex: https://seuprojeto.manus.space
BOT_TOKEN = "bdt_SEU_TOKEN_AQUI"  # Gere em: Dashboard > API Tokens
HEADERS = {"Content-Type": "application/json"}

def _post(endpoint, payload):
    data = {"0": {"json": {"authorization": f"Bearer {BOT_TOKEN}", **payload}}}
    try:
        r = requests.post(f"{DASH_URL}/api/trpc/{endpoint}?batch=1", json=data, headers=HEADERS, timeout=10)
        return r.json()[0].get("result", {}).get("data", {}).get("json", {})
    except Exception as e:
        print(f"[DASH] Erro: {e}")
        return {}

def heartbeat(activity=""):          return _post("botApi.heartbeat", {"activity": activity})
def log(level, msg, meta=""):        return _post("botApi.log", {"level": level, "message": msg, "metadata": meta})
def set_status(status, activity=""): return _post("botApi.status", {"status": status, "activity": activity})
def add_media(url, cat="", tipo="video", source="erome", canal=""): return _post("botApi.addMedia", {"sourceUrl": url, "category": cat, "mediaType": tipo, "source": source, "targetChannel": canal})
def add_subscriber(tid, name="", plan="basic", expires=""): return _post("botApi.addSubscriber", {"telegramId": tid, "name": name, "plan": plan, "expiresAt": expires})
def add_account(platform, user, email="", pwd="", phone="", proxy=""): return _post("botApi.addSocialAccount", {"platform": platform, "username": user, "email": email, "passwordEnc": pwd, "phone": phone, "proxyUsed": proxy})
`;

const DEFAULT_PROMPTS = [
  { botName: "Bot de Pagamento Sync Pay", botType: "payment", hosting: "discloud" as const, description: "Bot Telegram para gerenciar pagamentos via PIX usando API Sync Pay.", dependencies: '["python-telegram-bot>=20.0","requests","qrcode","Pillow"]', envVars: '["BOT_TOKEN","SYNCPAY_API_KEY","SYNCPAY_WEBHOOK_SECRET","VIP_CHANNEL_ID","DASH_URL","DASH_API_TOKEN"]', version: "1.0.0",
    promptText: `Crie um bot Python para Telegram usando python-telegram-bot v20+ que integra com a API Sync Pay para processar pagamentos PIX E com o Bot Dashboard para monitoramento.

FUNCIONALIDADES:
1. Comando /start - Apresenta planos (Basic R$9,90 | Premium R$19,90 | VIP R$29,90)
2. Comando /assinar <plano> - Inicia fluxo de pagamento
3. Geracao de QR Code PIX via API Sync Pay
4. Webhook para confirmar pagamentos automaticamente
5. Ao confirmar pagamento: adicionar usuario ao grupo VIP + registrar no dashboard
6. Comando /status - Verifica status da assinatura
7. Heartbeat a cada 5 minutos para o dashboard

ESTRUTURA:
- Classe SyncPayAPI: create_charge(), check_payment(), setup_webhook()
- Handlers: start, subscribe, payment_callback, status
- SQLite para assinantes e pagamentos locais
- Renovacao automatica com notificacao 3 dias antes

INTEGRACAO COM DASHBOARD (inclua este codigo no bot):
${DASH_INTEGRATION_CODE}
# Ao confirmar pagamento:
add_subscriber(telegram_id, name=user_name, plan="vip", expires=expires_at_iso)
log("info", f"Pagamento confirmado: {telegram_id} - plano {plan}")

# Heartbeat loop (rode em thread separada):
import threading
def heartbeat_loop():
    while True:
        heartbeat("Aguardando pagamentos")
        time.sleep(300)
threading.Thread(target=heartbeat_loop, daemon=True).start()

VARIAVEIS: BOT_TOKEN, SYNCPAY_API_KEY, SYNCPAY_WEBHOOK_SECRET, VIP_CHANNEL_ID, DASH_URL, DASH_API_TOKEN

DEPLOY (Discloud): discloud.config tipo bot, RAM 256MB, main.py, requirements.txt` },
  { botName: "Bot Captura Erome", botType: "media_capture", hosting: "vps" as const, description: "Extrai URLs de midias do Erome com categorizacao automatica por hashtags, sem download local.", dependencies: '["requests","beautifulsoup4","aiohttp","schedule"]', envVars: '["DASH_URL","DASH_API_TOKEN","EROME_PROFILES"]', version: "1.0.0",
    promptText: `Crie um bot Python que monitora perfis/albums do Erome e extrai URLs de midias SEM download local, enviando para o Bot Dashboard.

FUNCIONALIDADES:
1. Monitorar lista de perfis/albums configurados em EROME_PROFILES (separados por virgula)
2. Usar requests + BeautifulSoup para extrair URLs diretas de videos e imagens
3. Detectar categorias pelo titulo do album (#novinha, #milf, #teen, #gostosa)
4. Enviar URLs para dashboard via add_media()
5. Evitar duplicatas com SQLite (hash das URLs)
6. Verificacao a cada 30 minutos via schedule
7. Heartbeat a cada 5 minutos

EXTRACO SEM DOWNLOAD:
- Acessar pagina do album Erome com requests + headers de browser
- Extrair src dos elementos <video> e <img class="img-back">
- Retornar apenas URLs, nunca baixar conteudo
- Identificar tipo pela extensao (.mp4=video, .jpg/.jpeg/.png=image, .gif=gif)

CATEGORIZACAO (mapeamento de palavras-chave):
- novinha, teen, 18 -> #novinha
- milf, madura, coroa -> #milf
- gostosa, hot -> #gostosa
- Fallback: #geral

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Para cada URL extraida:
add_media(url, cat="#novinha", tipo="video", source="erome", canal="@seu_canal")
log("info", f"Midia capturada: {url}")

VARIAVEIS: DASH_URL, DASH_API_TOKEN, EROME_PROFILES
DEPLOY (VPS): systemd service ou screen, Python 3.10+` },
  { botName: "Bot Distribuidor de Midias", botType: "distributor", hosting: "vps" as const, description: "Le a fila do dashboard e posta nos canais corretos via URL direta, a cada 15 minutos.", dependencies: '["telethon","requests","schedule","aiohttp"]', envVars: '["TELEGRAM_API_ID","TELEGRAM_API_HASH","PHONE","DASH_URL","DASH_API_TOKEN","CANAL_NOVINHA","CANAL_MILF","CANAL_GERAL"]', version: "1.0.0",
    promptText: `Crie um bot Python usando Telethon que distribui midias para canais do Telegram SEM download local, lendo a fila do Bot Dashboard.

FUNCIONALIDADES:
1. A cada 15 minutos: buscar midias pendentes via API do dashboard
2. Para cada midia: identificar canal alvo pela categoria
3. Enviar via URL direta usando Telethon (send_file com URL)
4. Atualizar status da midia no dashboard
5. Rate limit: max 20 msgs/min por canal
6. Heartbeat a cada 5 minutos

MAPEAMENTO CATEGORIA -> CANAL:
#novinha -> CANAL_NOVINHA, #milf -> CANAL_MILF, padrao -> CANAL_GERAL

ENVIO SEM DOWNLOAD:
- client.send_file(canal, url_da_midia, caption=categoria)
- Telegram baixa diretamente da URL, nenhum arquivo local

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Buscar midias pendentes (use requests diretamente para GET):
def get_pending_media():
    r = requests.post(f"{DASH_URL}/api/trpc/media.list?batch=1",
        json={"0":{"json":{"status":"pending","limit":20}}}, headers=HEADERS)
    return r.json()[0]["result"]["data"]["json"]

# Apos postar:
log("info", f"Midia postada: {media_id} -> {canal}")
heartbeat(f"Postando em {canal}")

VARIAVEIS: TELEGRAM_API_ID, TELEGRAM_API_HASH, PHONE, DASH_URL, DASH_API_TOKEN, CANAL_NOVINHA, CANAL_MILF, CANAL_GERAL
DEPLOY (VPS): systemd service, Python 3.10+` },
  { botName: "Bot Clonador de Canal", botType: "cloner", hosting: "vps" as const, description: "Clona midias de canais/grupos do Telegram alvo e adiciona a fila de publicacao.", dependencies: '["telethon","requests","sqlite3"]', envVars: '["TELEGRAM_API_ID","TELEGRAM_API_HASH","PHONE","DASH_URL","DASH_API_TOKEN","TARGET_CHANNELS","MEU_GRUPO_STAGING"]', version: "1.0.0",
    promptText: `Crie um bot Python usando Telethon para clonar midias de canais/grupos do Telegram e enviar para o Bot Dashboard.

FUNCIONALIDADES:
1. Monitorar TARGET_CHANNELS (separados por virgula) - canais MEUS, nao de terceiros
2. Ler historico de mensagens via Telethon
3. Extrair URLs de midias sem baixar localmente
4. Detectar categoria pelas hashtags nas legendas (#novinha, #milf, etc)
5. Enviar para dashboard via add_media()
6. Evitar duplicatas com SQLite (hash do message_id)
7. Monitorar novos posts em tempo real via event handler

EXTRACO SEM DOWNLOAD:
- Para fotos: usar message.photo, pegar file_id e construir URL via Telegram CDN
- Para videos: message.document.mime_type == video/mp4
- Alternativa mais simples: forward_messages para MEU_GRUPO_STAGING e pegar URL

MONITORAMENTO:
- @client.on(events.NewMessage(chats=target_channels))
- Varredura historica a cada 2 horas

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Para cada midia encontrada:
add_media(url, cat=categoria_detectada, source="telegram_clone", canal="@canal_destino")
log("info", f"Clonado: {msg_id} de {canal_origem}")

VARIAVEIS: TELEGRAM_API_ID, TELEGRAM_API_HASH, PHONE, DASH_URL, DASH_API_TOKEN, TARGET_CHANNELS, MEU_GRUPO_STAGING
DEPLOY (VPS): systemd service, Python 3.10+` },
  { botName: "Bot Criador de Contas", botType: "account_creator", hosting: "vps" as const, description: "Cria contas no X e Instagram usando Playwright, armazena credenciais no banco.", dependencies: '["playwright","requests","faker","python-dotenv"]', envVars: '["DASH_URL","DASH_API_TOKEN","PROXY_LIST","SMS_API_KEY","CAPTCHA_API_KEY"]', version: "1.0.0",
    promptText: `Crie um bot Python usando Playwright para criar contas automaticamente no X (Twitter) e Instagram, integrando com 5sim.net para SMS, temp-mail.org para email temporario e o Bot Dashboard para monitoramento.

OBSERVACAO: Requer VPS com Playwright + Chromium. NAO roda no Discloud.

--- SERVICOS EXTERNOS ---

1. EMAIL TEMPORARIO (temp-mail.org API):
import requests

def criar_email_temp():
    # Gerar email aleatorio
    r = requests.get("https://api.internal.temp-mail.io/api/v3/email/new", timeout=10)
    data = r.json()
    return data["email"]  # ex: xk92mz@tempmail.io

def aguardar_codigo_email(email, timeout=120):
    import time, re
    inicio = time.time()
    while time.time() - inicio < timeout:
        r = requests.get(f"https://api.internal.temp-mail.io/api/v3/email/{email}/messages", timeout=10)
        msgs = r.json().get("messages", [])
        for msg in msgs:
            codigo = re.search(r'\b(\d{6})\b', msg.get("body_text", ""))
            if codigo:
                return codigo.group(1)
        time.sleep(5)
    return None  # timeout

2. SMS VIA 5SIM.NET (para X/Twitter - $0.01 por numero):
FIVESIM_API_KEY = "SUA_CHAVE_5SIM"

def comprar_numero_5sim(pais="usa"):
    headers = {"Authorization": f"Bearer {FIVESIM_API_KEY}", "Accept": "application/json"}
    r = requests.get(f"https://5sim.net/v1/user/buy/activation/{pais}/twitter/any", headers=headers)
    data = r.json()
    return data["id"], data["phone"]  # id para consultar, phone para usar

def aguardar_sms_5sim(order_id, timeout=120):
    import time, re
    headers = {"Authorization": f"Bearer {FIVESIM_API_KEY}", "Accept": "application/json"}
    inicio = time.time()
    while time.time() - inicio < timeout:
        r = requests.get(f"https://5sim.net/v1/user/check/{order_id}", headers=headers)
        data = r.json()
        sms_list = data.get("sms", [])
        if sms_list:
            codigo = re.search(r'\b(\d{6})\b', sms_list[-1].get("text", ""))
            if codigo:
                requests.get(f"https://5sim.net/v1/user/finish/{order_id}", headers=headers)
                return codigo.group(1)
        time.sleep(5)
    requests.get(f"https://5sim.net/v1/user/cancel/{order_id}", headers=headers)
    return None  # timeout, numero cancelado

--- FLUXO TWITTER/X ---
1. Gerar dados falsos com Faker (nome, data nascimento)
2. Criar email temporario via temp-mail.org
3. Comprar numero USA via 5sim.net ($0.01)
4. Abrir twitter.com/i/flow/signup com Playwright headless
5. Preencher nome, email, data de nascimento
6. Aguardar codigo de verificacao de email via aguardar_codigo_email()
7. Se pedir SMS: usar numero do 5sim via aguardar_sms_5sim()
8. Definir senha forte, completar perfil
9. Salvar conta no dashboard

--- FLUXO INSTAGRAM ---
1. Gerar dados falsos com Faker
2. Criar email temporario via temp-mail.org
3. Abrir instagram.com/accounts/emailsignup/ com Playwright
4. Preencher nome, email, data de nascimento, senha
5. Aguardar codigo de verificacao de email via aguardar_codigo_email()
6. SE INSTAGRAM PEDIR NUMERO DE TELEFONE:
   - NAO tentar criar a conta
   - Chamar: log("warning", "Instagram pediu numero de telefone - conta abortada")
   - Registrar falha no dashboard e PULAR para proxima conta
   - Motivo: nao usar SMS para Instagram para economizar
7. Completar perfil com bio contendo link do Telegram
8. Salvar conta no dashboard

--- DETECCAO DE PEDIDO DE NUMERO (Instagram) ---
Detectar via Playwright se aparece qualquer um destes seletores:
- input[name="phone_number"]
- texto contendo "numero de telefone" ou "phone number"
- URL contendo "/challenge/" ou "/verify/"
Se detectado: abortar imediatamente e notificar dashboard.

--- SEGURANCA ANTI-BAN ---
- User-agent realista e unico por conta
- Viewport e timezone aleatorios
- Delays aleatorios 3-8 segundos entre cada acao
- Proxy diferente por conta (HTTP/SOCKS5)
- Max 5 contas/hora por IP
- Aguardar 30-60 min entre sessoes no mesmo IP

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Conta X criada com sucesso:
add_account("twitter", username, email=email, pwd=senha, phone=phone_5sim, proxy=proxy)
log("info", f"Conta X criada: @{username}")

# Conta Instagram criada com sucesso:
add_account("instagram", username, email=email, pwd=senha, proxy=proxy)
log("info", f"Conta Instagram criada: @{username}")

# Instagram pediu numero - abortar:
log("warning", f"Instagram pediu numero de telefone para {email} - conta abortada")

# Heartbeat:
heartbeat(f"Criando contas - X:{contas_x} | IG:{contas_ig} hoje")

VARIAVEIS: DASH_URL, DASH_API_TOKEN, FIVESIM_API_KEY, PROXY_LIST, CONTAS_POR_HORA
DEPLOY (VPS): Python 3.10+, pip install playwright faker requests, playwright install chromium` },
  { botName: "Bot Postagem Social 24/7", botType: "social_poster", hosting: "vps" as const, description: "Posta conteudo 24/7 no X e Instagram para geracao de leads usando Playwright.", dependencies: '["playwright","requests","schedule"]', envVars: '["DASH_URL","DASH_API_TOKEN","TELEGRAM_LINK","POST_INTERVAL_MIN"]', version: "1.0.0",
    promptText: `Crie um bot Python que posta conteudo 24/7 no X e Instagram para geracao de leads, usando Playwright e integrando com o Bot Dashboard.

OBSERVACAO: Este bot requer VPS pois usa Playwright (Chromium). NAO roda no Discloud.

FUNCIONALIDADES:
1. Buscar contas ativas do dashboard via requests
2. Para cada conta: postar com link para Telegram
3. Rotacionar entre contas para evitar ban
4. Postar a cada 30-60 minutos por conta
5. Playwright headless para automacao do browser
6. Heartbeat e logs no dashboard

CONTEUDO DOS POSTS:
- Texto variado: "Conteudo exclusivo no Telegram! Link na bio"
- Imagem: thumbnail da midia (URL direta, sem download)
- Hashtags para alcance organico
- Link Telegram no perfil da conta

ANTI-BAN:
- Max 10 posts/dia por conta
- Delays aleatorios 30-90 min entre posts
- Variar texto e hashtags a cada post
- Usar proxy especifico da conta
- Pausar conta automaticamente se detectar restricao

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Buscar contas ativas:
def get_active_accounts():
    r = requests.post(f"{DASH_URL}/api/trpc/socialAccounts.list?batch=1",
        json={"0":{"json":{"limit":50}}}, headers=HEADERS)
    return r.json()[0]["result"]["data"]["json"]

# Apos cada post:
log("info", f"Post realizado: @{username} no {platform}")
heartbeat(f"Postando - {posts_hoje} posts hoje")

VARIAVEIS: DASH_URL, DASH_API_TOKEN, TELEGRAM_LINK, POST_INTERVAL_MIN
DEPLOY (VPS): Python 3.10+, playwright install chromium, systemd service` },
  { botName: "Bot Monitor de Heartbeat", botType: "monitor", hosting: "discloud" as const, description: "Verifica heartbeat de todos os bots e envia alertas quando detecta falhas. Roda no Discloud.", dependencies: '["python-telegram-bot>=20.0","requests","schedule"]', envVars: '["BOT_TOKEN","ADMIN_CHAT_ID","DASH_URL","DASH_API_TOKEN","HEARTBEAT_TIMEOUT_MIN"]', version: "1.0.0",
    promptText: `Crie um bot Python para Telegram que monitora o status de todos os outros bots via Bot Dashboard e envia alertas ao admin.

OBSERVACAO: Este bot roda no Discloud. Apenas usa python-telegram-bot + requests, sem dependencias pesadas.

FUNCIONALIDADES:
1. A cada 5 minutos: buscar lista de bots do dashboard
2. Verificar last_heartbeat de cada bot
3. Se > HEARTBEAT_TIMEOUT_MIN: enviar alerta no Telegram para ADMIN_CHAT_ID
4. Registrar alerta no dashboard via log()
5. Comando /status - Lista status de todos os bots com emojis
6. Comando /ping - Verifica se o monitor esta ativo
7. Relatorio diario as 08:00 com resumo

LOGICA DE ALERTA:
- 1o alerta: "⚠️ Bot X sem heartbeat ha Y minutos"
- 2o alerta (30min depois): "🚨 CRITICO: Bot X offline"
- Resolucao automatica: "✅ Bot X voltou ao ar"
- Anti-spam: max 1 alerta por bot a cada 15min

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Buscar bots:
def get_all_bots():
    r = requests.post(f"{DASH_URL}/api/trpc/bots.list?batch=1",
        json={"0":{"json":{}}}, headers=HEADERS)
    return r.json()[0]["result"]["data"]["json"]

# Verificar heartbeat:
from datetime import datetime, timezone
for bot in get_all_bots():
    if bot["lastHeartbeat"]:
        delta = (datetime.now(timezone.utc) - datetime.fromisoformat(bot["lastHeartbeat"])).seconds / 60
        if delta > int(HEARTBEAT_TIMEOUT_MIN):
            log("error", f"Bot {bot['name']} offline ha {delta:.0f} min")
            # enviar alerta Telegram

VARIAVEIS: BOT_TOKEN, ADMIN_CHAT_ID, DASH_URL, DASH_API_TOKEN, HEARTBEAT_TIMEOUT_MIN
DEPLOY (Discloud): discloud.config tipo bot, RAM 100MB, main.py, requirements.txt` },
  { botName: "Bot Preenchedor VIP", botType: "vip_filler", hosting: "discloud" as const, description: "Preenche o grupo VIP com conteudo exclusivo para assinantes pagantes. Roda no Discloud.", dependencies: '["telethon","requests","schedule"]', envVars: '["TELEGRAM_API_ID","TELEGRAM_API_HASH","PHONE","VIP_CHANNEL_ID","DASH_URL","DASH_API_TOKEN"]', version: "1.0.0",
    promptText: `Crie um bot Python usando Telethon para preencher o grupo VIP com conteudo exclusivo, integrando com o Bot Dashboard.

OBSERVACAO: Este bot roda no Discloud. Telethon e leve e suportado. Sem Playwright ou scraping pesado.

FUNCIONALIDADES:
1. A cada 30 minutos: buscar midias aprovadas do dashboard
2. Selecionar midias premium para o VIP (prioridade por categoria)
3. Postar no VIP_CHANNEL_ID via URL direta (sem download)
4. Legenda exclusiva com categoria e marca d'agua textual
5. Verificar assinantes expirados e remover do canal
6. Enviar mensagem de renovacao 3 dias antes do vencimento
7. Heartbeat a cada 5 minutos

CONTEUDO VIP:
- Prioridade para categorias premium (#milf, #novinha)
- Legenda: "[VIP] Conteudo exclusivo para assinantes"
- Compilacoes especiais as sextas-feiras
- Conteudo 24h antes dos canais publicos

GESTAO DE MEMBROS:
- Verificar assinantes expirados via dashboard a cada hora
- await client.kick_participant(VIP_CHANNEL_ID, user_id) para remover
- Enviar DM antes de remover: "Sua assinatura vence em X dias"

INTEGRACAO COM DASHBOARD:
${DASH_INTEGRATION_CODE}
# Buscar midias para VIP:
def get_vip_media():
    r = requests.post(f"{DASH_URL}/api/trpc/media.list?batch=1",
        json={"0":{"json":{"status":"posted","limit":5}}}, headers=HEADERS)
    return r.json()[0]["result"]["data"]["json"]

# Apos postar:
log("info", f"VIP: midia postada no canal {VIP_CHANNEL_ID}")
heartbeat("Preenchendo canal VIP")

VARIAVEIS: TELEGRAM_API_ID, TELEGRAM_API_HASH, PHONE, VIP_CHANNEL_ID, DASH_URL, DASH_API_TOKEN
DEPLOY (Discloud): discloud.config tipo bot, RAM 200MB, main.py, requirements.txt` },
];

const HOSTING_TABLE = [
  { bot: "Bot de Pagamento Sync Pay", hosting: "discloud", ram: "256MB", note: "python-telegram-bot + requests" },
  { bot: "Bot Captura Erome", hosting: "vps", ram: "512MB", note: "BeautifulSoup + scraping pesado" },
  { bot: "Bot Distribuidor de Midias", hosting: "discloud", ram: "256MB", note: "Telethon leve" },
  { bot: "Bot Clonador de Canal", hosting: "discloud", ram: "256MB", note: "Telethon leve" },
  { bot: "Bot Criador de Contas", hosting: "vps", ram: "1GB", note: "Playwright + Chromium" },
  { bot: "Bot Postagem Social 24/7", hosting: "vps", ram: "1GB", note: "Playwright + Chromium" },
  { bot: "Bot Monitor de Heartbeat", hosting: "discloud", ram: "100MB", note: "Apenas requests" },
  { bot: "Bot Preenchedor VIP", hosting: "discloud", ram: "200MB", note: "Telethon leve" },
];

export default function Prompts() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHosting, setShowHosting] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [form, setForm] = useState({ botName: "", botType: "", description: "", promptText: "", hosting: "vps" as "discloud" | "vps" | "local", dependencies: "", envVars: "" });
  const [seeded, setSeeded] = useState(false);

  const { data: promptList, isLoading, refetch } = trpc.prompts.list.useQuery(undefined, { refetchInterval: 60000 });
  const upsert = trpc.prompts.upsert.useMutation({ onSuccess: () => { toast.success("Prompt salvo!"); setShowForm(false); refetch(); }, onError: (e) => toast.error(e.message) });

  useEffect(() => {
    if (!seeded && promptList && promptList.length === 0 && !isLoading) {
      setSeeded(true);
      DEFAULT_PROMPTS.forEach((p) => upsert.mutate({ ...p, version: "1.0.0" }));
    }
  }, [promptList, isLoading, seeded]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Prompt copiado!"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">PROMPTS</span> <span className="neon-cyan">DOS BOTS</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">DOCUMENTACAO COMPLETA - BACKUP DE REGENERACAO VIA IA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
            <Plus size={12} /> Novo Prompt
          </button>
        </div>
      </div>

      {/* Painel: Tabela de Hospedagem */}
      <div className="cyber-card rounded-sm overflow-hidden">
        <button onClick={() => setShowHosting(!showHosting)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-[rgba(0,245,255,0.02)] transition-all">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00f5ff]" style={{ boxShadow: "0 0 6px #00f5ff" }} />
            <span className="font-display text-xs tracking-widest text-[#00f5ff] uppercase">Tabela de Hospedagem</span>
            <span className="font-mono-cyber text-[10px] text-[#6b6b8a]">— Discloud vs VPS por bot</span>
          </div>
          {showHosting ? <ChevronUp size={14} className="text-[#6b6b8a]" /> : <ChevronDown size={14} className="text-[#6b6b8a]" />}
        </button>
        {showHosting && (
          <div className="border-t border-[#1a1a2e] p-4 overflow-x-auto">
            <table className="w-full text-xs font-mono-cyber">
              <thead>
                <tr className="text-[#6b6b8a] border-b border-[#1a1a2e]">
                  <th className="text-left pb-2 pr-4">Bot</th>
                  <th className="text-left pb-2 pr-4">Hospedagem</th>
                  <th className="text-left pb-2 pr-4">RAM</th>
                  <th className="text-left pb-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {HOSTING_TABLE.map((row) => (
                  <tr key={row.bot} className="border-b border-[#0d0d1a]">
                    <td className="py-2 pr-4 text-[#e0e0f0]">{row.bot}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] border" style={{ borderColor: row.hosting === "discloud" ? "#9d4edd" : "#00f5ff", color: row.hosting === "discloud" ? "#9d4edd" : "#00f5ff" }}>
                        {row.hosting === "discloud" ? "DISCLOUD" : "VPS"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[#ff2d78]">{row.ram}</td>
                    <td className="py-2 text-[#6b6b8a]">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel: Código de Integração */}
      <div className="cyber-card rounded-sm overflow-hidden">
        <button onClick={() => setShowIntegration(!showIntegration)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-[rgba(255,45,120,0.02)] transition-all">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff2d78]" style={{ boxShadow: "0 0 6px #ff2d78" }} />
            <span className="font-display text-xs tracking-widest text-[#ff2d78] uppercase">Código de Integração Python</span>
            <span className="font-mono-cyber text-[10px] text-[#6b6b8a]">— Cole em qualquer bot para conectar ao dashboard</span>
          </div>
          {showIntegration ? <ChevronUp size={14} className="text-[#6b6b8a]" /> : <ChevronDown size={14} className="text-[#6b6b8a]" />}
        </button>
        {showIntegration && (
          <div className="border-t border-[#1a1a2e] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase">Substitua DASH_URL e BOT_TOKEN antes de usar</p>
              <button onClick={() => copy(DASH_INTEGRATION_CODE)} className="flex items-center gap-1 font-mono-cyber text-[10px] text-[#00f5ff] hover:underline"><Copy size={10} /> Copiar</button>
            </div>
            <pre className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm p-4 text-[11px] font-mono-cyber text-[#e0e0f0] whitespace-pre-wrap overflow-x-auto">{DASH_INTEGRATION_CODE}</pre>
          </div>
        )}
      </div>

      {showForm && (
        <div className="cyber-card p-5 rounded-sm">
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Novo Prompt de Bot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Nome do Bot</label>
              <input value={form.botName} onChange={(e) => setForm((p) => ({ ...p, botName: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="Bot de Pagamento" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Hospedagem</label>
              <select value={form.hosting} onChange={(e) => setForm((p) => ({ ...p, hosting: e.target.value as "discloud" | "vps" | "local" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="discloud">Discloud</option><option value="vps">VPS</option><option value="local">Local</option>
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Descricao</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="Descricao breve" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Tipo</label>
              <input value={form.botType} onChange={(e) => setForm((p) => ({ ...p, botType: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="payment" />
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Prompt Completo</label>
              <textarea value={form.promptText} onChange={(e) => setForm((p) => ({ ...p, promptText: e.target.value }))} rows={8}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber resize-none"
                placeholder="Descreva detalhadamente o bot para que uma IA possa gera-lo..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => upsert.mutate({ ...form, version: "1.0.0" })} disabled={upsert.isPending}
              className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              {upsert.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-12 font-mono-cyber text-[#6b6b8a]">Carregando prompts...</div>}

      <div className="space-y-3">
        {promptList?.map((p, i) => (
          <div key={p.id} className="cyber-card rounded-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,45,120,0.02)]" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center font-display text-xs shrink-0" style={{ background: i % 2 === 0 ? "rgba(255,45,120,0.15)" : "rgba(0,245,255,0.1)", border: `1px solid ${i % 2 === 0 ? "rgba(255,45,120,0.3)" : "rgba(0,245,255,0.2)"}`, color: i % 2 === 0 ? "#ff2d78" : "#00f5ff" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="font-display text-sm text-[#e0e0f0]">{p.botName}</p>
                  <p className="font-mono-cyber text-[10px] text-[#6b6b8a]">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber border" style={{ borderColor: p.hosting === "discloud" ? "#9d4edd" : "#00f5ff", color: p.hosting === "discloud" ? "#9d4edd" : "#00f5ff" }}>{p.hosting.toUpperCase()}</span>
                <button onClick={(e) => { e.stopPropagation(); copy(p.promptText); }} className="text-[#6b6b8a] hover:text-[#00f5ff] transition-colors p-1"><Copy size={14} /></button>
                {expanded === p.id ? <ChevronUp size={14} className="text-[#6b6b8a]" /> : <ChevronDown size={14} className="text-[#6b6b8a]" />}
              </div>
            </div>
            {expanded === p.id && (
              <div className="border-t border-[#1a1a2e] p-5">
                {p.dependencies && (
                  <div className="mb-4">
                    <p className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase mb-2">Dependencias</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(p.dependencies).map((d: string) => (
                        <span key={d} className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber bg-[rgba(0,245,255,0.08)] text-[#00f5ff] border border-[rgba(0,245,255,0.2)]">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {p.envVars && (
                  <div className="mb-4">
                    <p className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase mb-2">Variaveis de Ambiente</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(p.envVars).map((v: string) => (
                        <span key={v} className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber bg-[rgba(255,45,120,0.08)] text-[#ff2d78] border border-[rgba(255,45,120,0.2)]">{v}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase">Prompt Completo</p>
                    <button onClick={() => copy(p.promptText)} className="flex items-center gap-1 font-mono-cyber text-[10px] text-[#00f5ff] hover:underline"><Copy size={10} /> Copiar</button>
                  </div>
                  <pre className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm p-4 text-[11px] font-mono-cyber text-[#e0e0f0] whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto">{p.promptText}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
