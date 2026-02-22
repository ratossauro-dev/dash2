import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Key, Plus, Trash2, Copy, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Tokens() {
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [showToken, setShowToken] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: bots } = trpc.bots.list.useQuery();
  const { data: tokens, refetch: refetchTokens } = trpc.apiTokens.listByBot.useQuery(
    { botId: selectedBotId! },
    { enabled: selectedBotId !== null }
  );

  const generateToken = trpc.apiTokens.generate.useMutation({
    onSuccess: () => {
      toast.success("Token gerado com sucesso!");
      setTokenName("");
      refetchTokens();
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeToken = trpc.apiTokens.revoke.useMutation({
    onSuccess: () => {
      toast.success("Token revogado.");
      refetchTokens();
    },
    onError: (e) => toast.error(e.message),
  });

  const copyToken = (id: number, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    toast.success("Token copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedBot = bots?.find(b => b.id === selectedBotId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/bots">
          <button className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all">
            <ArrowLeft size={14} />
          </button>
        </Link>
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">API</span> <span className="neon-cyan">TOKENS</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">AUTENTICAÇÃO DOS BOTS COM O DASHBOARD</p>
        </div>
      </div>

      {/* Info box */}
      <div className="cyber-card p-4 rounded-sm border border-[#00f5ff]/20" style={{ background: "rgba(0,245,255,0.03)" }}>
        <div className="font-display text-[10px] neon-cyan mb-2 tracking-widest">COMO FUNCIONA</div>
        <p className="font-mono-cyber text-[11px] text-[#6b6b8a] leading-relaxed">
          Cada bot Python usa um token Bearer para se comunicar com o dashboard. O bot envia heartbeat, logs e status via <span className="text-[#00f5ff]">POST /api/trpc/botApi.*</span> com o header <span className="text-[#ff2d78]">Authorization: Bearer bdt_...</span>
        </p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { endpoint: "botApi.heartbeat", desc: "Sinal de vida + operação" },
            { endpoint: "botApi.log", desc: "Enviar log" },
            { endpoint: "botApi.status", desc: "Atualizar status" },
            { endpoint: "botApi.addMedia", desc: "Adicionar mídia à fila" },
            { endpoint: "botApi.addSubscriber", desc: "Registrar assinante" },
            { endpoint: "botApi.addSocialAccount", desc: "Registrar conta social" },
          ].map(e => (
            <div key={e.endpoint} className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm p-2">
              <div className="font-mono-cyber text-[9px] text-[#ff2d78]">{e.endpoint}</div>
              <div className="font-mono-cyber text-[9px] text-[#6b6b8a] mt-0.5">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Select bot */}
      <div className="cyber-card p-5 rounded-sm">
        <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-2">Selecionar Bot</label>
        <select
          value={selectedBotId ?? ""}
          onChange={e => setSelectedBotId(e.target.value ? Number(e.target.value) : null)}
          className="w-full md:w-72 bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber"
        >
          <option value="">-- Escolha um bot --</option>
          {bots?.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
          ))}
        </select>
      </div>

      {selectedBotId && (
        <>
          {/* Generate token */}
          <div className="cyber-card p-5 rounded-sm">
            <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">
              Gerar Token para <span className="neon-pink">{selectedBot?.name}</span>
            </h2>
            <div className="flex gap-3">
              <input
                value={tokenName}
                onChange={e => setTokenName(e.target.value)}
                placeholder="Nome do token (ex: Produção VPS)"
                className="flex-1 bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber"
              />
              <button
                onClick={() => generateToken.mutate({ botId: selectedBotId, name: tokenName })}
                disabled={generateToken.isPending || !tokenName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78", boxShadow: "0 0 15px rgba(255,45,120,0.3)" }}
              >
                <Plus size={12} /> {generateToken.isPending ? "Gerando..." : "Gerar Token"}
              </button>
            </div>
          </div>

          {/* Token list */}
          <div className="cyber-card rounded-sm overflow-hidden">
            <div className="p-4 border-b border-[#1a1a2e]">
              <span className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase">Tokens Ativos</span>
              <span className="ml-2 font-mono-cyber text-[10px] text-[#6b6b8a]">({tokens?.filter(t => t.isActive).length ?? 0})</span>
            </div>
            {!tokens || tokens.length === 0 ? (
              <div className="p-8 text-center">
                <Key size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" />
                <p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum token gerado para este bot</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a2e]">
                {tokens.map(t => (
                  <div key={t.id} className={`p-4 flex items-center gap-4 ${!t.isActive ? "opacity-40" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-xs text-[#e0e0f0]">{t.name}</span>
                        {t.isActive ? (
                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono-cyber" style={{ background: "rgba(57,255,20,0.1)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.3)" }}>ATIVO</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono-cyber" style={{ background: "rgba(107,107,138,0.1)", color: "#6b6b8a", border: "1px solid #1a1a2e" }}>REVOGADO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono-cyber text-[11px] text-[#6b6b8a] truncate max-w-xs">
                          {showToken[t.id] ? t.token : `${t.token.slice(0, 12)}${"•".repeat(20)}`}
                        </code>
                        <button onClick={() => setShowToken(prev => ({ ...prev, [t.id]: !prev[t.id] }))} className="text-[#6b6b8a] hover:text-[#00f5ff] transition-colors shrink-0">
                          {showToken[t.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <div className="font-mono-cyber text-[9px] text-[#6b6b8a] mt-1">
                        Criado: {new Date(t.createdAt).toLocaleString("pt-BR")}
                        {t.lastUsedAt && ` · Último uso: ${new Date(t.lastUsedAt).toLocaleString("pt-BR")}`}
                      </div>
                    </div>
                    {t.isActive && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => copyToken(t.id, t.token)} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all">
                          {copiedId === t.id ? <Check size={13} className="text-[#39ff14]" /> : <Copy size={13} />}
                        </button>
                        <button onClick={() => revokeToken.mutate({ id: t.id })} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#ff3131] hover:border-[#ff3131] transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Python snippet */}
          {tokens && tokens.filter(t => t.isActive).length > 0 && (
            <div className="cyber-card p-5 rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase">Código Python de Integração</span>
                <button
                  onClick={() => {
                    const activeToken = tokens.find(t => t.isActive)?.token ?? "SEU_TOKEN_AQUI";
                    const dashUrl = window.location.origin;
                    const code = getPythonSnippet(activeToken, dashUrl);
                    navigator.clipboard.writeText(code);
                    toast.success("Código copiado!");
                  }}
                  className="flex items-center gap-1 px-3 py-1 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all font-mono-cyber text-[10px]"
                >
                  <Copy size={11} /> Copiar
                </button>
              </div>
              <pre className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm p-4 overflow-x-auto text-[11px] font-mono-cyber text-[#6b6b8a] leading-relaxed">
                <code>{getPythonSnippet(tokens.find(t => t.isActive)?.token ?? "SEU_TOKEN_AQUI", window.location.origin)}</code>
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getPythonSnippet(token: string, dashUrl: string): string {
  return `import requests
import time

# ─── Configuração do Dashboard ───────────────────────────────────────────
DASH_URL = "${dashUrl}"
BOT_TOKEN = "${token}"
HEADERS = {"Content-Type": "application/json"}

def _post(endpoint: str, payload: dict) -> dict:
    """Envia requisição autenticada para o dashboard."""
    data = {"0": {"json": {"authorization": f"Bearer {BOT_TOKEN}", **payload}}}
    try:
        r = requests.post(
            f"{DASH_URL}/api/trpc/{endpoint}?batch=1",
            json=data, headers=HEADERS, timeout=10
        )
        return r.json()[0].get("result", {}).get("data", {}).get("json", {})
    except Exception as e:
        print(f"[DASH] Erro ao conectar: {e}")
        return {}

def heartbeat(activity: str = ""):
    """Envia sinal de vida. Chame a cada 5 minutos."""
    return _post("botApi.heartbeat", {"activity": activity})

def log(level: str, message: str, metadata: str = ""):
    """Registra log no dashboard. level: info|warn|error|debug"""
    return _post("botApi.log", {"level": level, "message": message, "metadata": metadata})

def set_status(status: str, activity: str = ""):
    """Atualiza status. status: online|offline|error|idle"""
    return _post("botApi.status", {"status": status, "activity": activity})

def add_media(source_url: str, category: str = "", media_type: str = "video",
              source: str = "erome", target_channel: str = ""):
    """Adiciona mídia à fila sem download local."""
    return _post("botApi.addMedia", {
        "sourceUrl": source_url, "category": category,
        "mediaType": media_type, "source": source, "targetChannel": target_channel
    })

def add_subscriber(telegram_id: str, name: str = "", plan: str = "basic", expires_at: str = ""):
    """Registra novo assinante."""
    return _post("botApi.addSubscriber", {
        "telegramId": telegram_id, "name": name, "plan": plan, "expiresAt": expires_at
    })

def add_social_account(platform: str, username: str, email: str = "",
                       password_enc: str = "", phone: str = "", proxy: str = ""):
    """Registra conta social criada."""
    return _post("botApi.addSocialAccount", {
        "platform": platform, "username": username, "email": email,
        "passwordEnc": password_enc, "phone": phone, "proxyUsed": proxy
    })

# ─── Exemplo de uso ──────────────────────────────────────────────────────
if __name__ == "__main__":
    set_status("online", "Bot iniciado")
    log("info", "Bot iniciado com sucesso")

    # Loop principal com heartbeat a cada 5 minutos
    while True:
        try:
            heartbeat("Processando...")
            # ... lógica do bot aqui ...
            time.sleep(300)  # 5 minutos
        except KeyboardInterrupt:
            set_status("offline", "Bot encerrado pelo operador")
            break
        except Exception as e:
            log("error", str(e))
            set_status("error", str(e)[:100])
`;
}
