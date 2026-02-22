import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, ChevronDown, ChevronUp, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

const BOT_TYPES = ["payment", "media_capture", "distributor", "cloner", "account_creator", "social_poster", "monitor", "vip_filler"] as const;
const HOSTING_TYPES = ["discloud", "vps", "local"] as const;
const STATUS_TYPES = ["online", "offline", "error", "idle"] as const;
type BotType = typeof BOT_TYPES[number];
type HostingType = typeof HOSTING_TYPES[number];
type StatusType = typeof STATUS_TYPES[number];

const typeLabels: Record<BotType, string> = {
  payment: "Pagamento", media_capture: "Captura Erome", distributor: "Distribuidor",
  cloner: "Clonador", account_creator: "Criador Contas", social_poster: "Postagem Social",
  monitor: "Monitor", vip_filler: "VIP Filler",
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { online: "#39ff14", offline: "#6b6b8a", error: "#ff3131", idle: "#f5e642" };
  const color = colors[status] ?? "#6b6b8a";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: ["online","error"].includes(status) ? `0 0 6px ${color}` : "none" }} />
      <span className="font-mono-cyber text-[11px] uppercase" style={{ color }}>{status}</span>
    </span>
  );
}

export default function Bots() {
  const [showForm, setShowForm] = useState(false);
  const [expandedBot, setExpandedBot] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "payment" as BotType, hosting: "vps" as HostingType, description: "" });

  const { data: bots, isLoading, refetch } = trpc.bots.list.useQuery(undefined, { refetchInterval: 30000 });
  const { data: logs } = trpc.bots.getLogs.useQuery({ botId: expandedBot ?? undefined, limit: 10 }, { enabled: expandedBot !== null });
  const createBot = trpc.bots.create.useMutation({
    onSuccess: () => { toast.success("Bot criado!"); setShowForm(false); setForm({ name: "", type: "payment", hosting: "vps", description: "" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = trpc.bots.updateStatus.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">GERENCIAMENTO</span> <span className="neon-cyan">DE BOTS</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">{bots?.length ?? 0} BOTS CADASTRADOS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white transition-all" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78", boxShadow: "0 0 15px rgba(255,45,120,0.3)" }}>
            <Plus size={12} /> Novo Bot
          </button>
        </div>
      </div>

      {showForm && (
        <div className="cyber-card p-5 rounded-sm">
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Cadastrar Novo Bot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{ label: "Nome do Bot", key: "name", type: "text", placeholder: "ex: Bot Erome Captura" }, { label: "Descrição", key: "description", type: "text", placeholder: "Descrição opcional" }].map(f => (
              <div key={f.key}>
                <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">{f.label}</label>
                <input value={form[f.key as "name" | "description"]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as BotType }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                {BOT_TYPES.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Hospedagem</label>
              <select value={form.hosting} onChange={e => setForm(prev => ({ ...prev, hosting: e.target.value as HostingType }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                {HOSTING_TYPES.map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createBot.mutate(form)} disabled={createBot.isPending || !form.name.trim()}
              className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              {createBot.isPending ? "Criando..." : "Criar Bot"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
        </div>
      )}

      <div className="cyber-card rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full cyber-table">
            <thead><tr><th className="text-left">Nome</th><th className="text-left">Tipo</th><th className="text-left">Status</th><th className="text-left">Hosting</th><th className="text-left">Operações</th><th className="text-left">Erros</th><th className="text-left">Heartbeat</th><th className="text-left">Ações</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 font-mono-cyber text-[#6b6b8a]">Carregando...</td></tr>}
              {!isLoading && (!bots || bots.length === 0) && <tr><td colSpan={8} className="text-center py-12"><Bot size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" /><p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum bot cadastrado</p></td></tr>}
              {bots?.map(bot => (
                <React.Fragment key={bot.id}>
                  <tr>
                    <td>
                      <div className="flex items-center gap-2">
                        <Bot size={13} className="text-[#6b6b8a]" />
                        <div>
                          <span className="text-[#e0e0f0] font-medium">{bot.name}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono-cyber text-[9px] text-[#6b6b8a]">ID:</span>
                            <span className="font-mono-cyber text-[9px] text-[#ff2d78]">{bot.id}</span>
                            <button onClick={() => { navigator.clipboard.writeText(String(bot.id)); toast.success("ID copiado!"); }} className="text-[#6b6b8a] hover:text-[#00f5ff] transition-colors ml-0.5" title="Copiar ID">
                              <Copy size={9} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{typeLabels[bot.type as BotType] ?? bot.type}</span></td>
                    <td><StatusDot status={bot.status} /></td>
                    <td><span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber border" style={{ borderColor: bot.hosting === "discloud" ? "#9d4edd" : "#00f5ff", color: bot.hosting === "discloud" ? "#9d4edd" : "#00f5ff" }}>{bot.hosting.toUpperCase()}</span></td>
                    <td><span className="font-mono-cyber text-[#00f5ff]">{bot.totalOperations.toLocaleString()}</span></td>
                    <td><span className="font-mono-cyber" style={{ color: bot.errorCount > 0 ? "#ff3131" : "#6b6b8a" }}>{bot.errorCount}</span></td>
                    <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{bot.lastHeartbeat ? new Date(bot.lastHeartbeat).toLocaleString("pt-BR") : "Nunca"}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <select value={bot.status} onChange={e => updateStatus.mutate({ id: bot.id, status: e.target.value as StatusType })}
                          className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-2 py-1 text-[11px] font-mono-cyber text-[#6b6b8a] focus:outline-none">
                          {STATUS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => setExpandedBot(expandedBot === bot.id ? null : bot.id)} className="text-[#6b6b8a] hover:text-[#00f5ff] transition-colors">
                          {expandedBot === bot.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedBot === bot.id && (
                    <tr>
                      <td colSpan={8} className="bg-[#0a0a0f] p-4">
                        <div className="font-mono-cyber text-[10px] text-[#6b6b8a] mb-2 uppercase">Últimos Logs</div>
                        {logs?.length ? logs.map(log => (
                          <div key={log.id} className="flex items-start gap-2 text-[11px] mb-1">
                            <span className="font-mono-cyber shrink-0" style={{ color: log.level === "error" ? "#ff3131" : log.level === "warn" ? "#f5e642" : "#6b6b8a" }}>[{log.level.toUpperCase()}]</span>
                            <span className="font-mono-cyber text-[#e0e0f0]">{log.message}</span>
                            <span className="font-mono-cyber text-[#6b6b8a] shrink-0 ml-auto">{new Date(log.createdAt).toLocaleTimeString("pt-BR")}</span>
                          </div>
                        )) : <p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum log disponível</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
