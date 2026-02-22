import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const planColors: Record<string, string> = { basic: "#6b6b8a", premium: "#00f5ff", vip: "#f5e642" };
const statusColors: Record<string, string> = { active: "#39ff14", expired: "#6b6b8a", banned: "#ff3131", pending: "#f5e642" };

export default function Subscribers() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ telegramId: "", telegramUsername: "", name: "", plan: "basic" as "basic" | "premium" | "vip", status: "pending" as "active" | "expired" | "banned" | "pending" });

  const { data: subs, isLoading, refetch } = trpc.subscribers.list.useQuery({ limit: 100 }, { refetchInterval: 30000 });
  const { data: stats } = trpc.subscribers.stats.useQuery(undefined, { refetchInterval: 30000 });
  const upsert = trpc.subscribers.upsert.useMutation({ onSuccess: () => { toast.success("Assinante salvo!"); setShowForm(false); refetch(); }, onError: (e) => toast.error(e.message) });

  const statCards = [
    { label: "Total", value: stats?.total ?? 0, color: "#e0e0f0" },
    { label: "Ativos", value: stats?.active ?? 0, color: "#39ff14" },
    { label: "Expirados", value: stats?.expired ?? 0, color: "#6b6b8a" },
    { label: "VIP", value: stats?.vip ?? 0, color: "#f5e642" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">GERENCIAMENTO</span> <span className="neon-cyan">DE ASSINANTES</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">{subs?.length ?? 0} ASSINANTES CADASTRADOS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
            <Plus size={12} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="cyber-card p-4 rounded-sm text-center">
            <div className="font-display text-2xl font-bold mb-1" style={{ color: s.color, textShadow: `0 0 15px ${s.color}` }}>{s.value}</div>
            <div className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="cyber-card p-5 rounded-sm">
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Adicionar Assinante</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Telegram ID</label>
              <input value={form.telegramId} onChange={(e) => setForm((p) => ({ ...p, telegramId: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="123456789" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Username</label>
              <input value={form.telegramUsername} onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="@usuario" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Nome</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="Nome completo" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Plano</label>
              <select value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value as "basic" | "premium" | "vip" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="basic">Basic</option><option value="premium">Premium</option><option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "expired" | "banned" | "pending" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="pending">Pendente</option><option value="active">Ativo</option><option value="expired">Expirado</option><option value="banned">Banido</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || !form.telegramId.trim()}
              className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              {upsert.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
        </div>
      )}

      <div className="cyber-card rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full cyber-table">
            <thead><tr><th className="text-left">Telegram ID</th><th className="text-left">Username</th><th className="text-left">Nome</th><th className="text-left">Plano</th><th className="text-left">Status</th><th className="text-left">Expira em</th><th className="text-left">Cadastro</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-8 font-mono-cyber text-[#6b6b8a]">Carregando...</td></tr>}
              {!isLoading && (!subs || subs.length === 0) && <tr><td colSpan={7} className="text-center py-12"><Users size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" /><p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum assinante</p></td></tr>}
              {subs?.map((s) => (
                <tr key={s.id}>
                  <td><span className="font-mono-cyber text-[11px] text-[#00f5ff]">{s.telegramId}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#e0e0f0]">{s.telegramUsername ?? "-"}</span></td>
                  <td><span className="text-sm text-[#e0e0f0]">{s.name ?? "-"}</span></td>
                  <td><span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber border uppercase" style={{ borderColor: planColors[s.plan], color: planColors[s.plan], background: `${planColors[s.plan]}15` }}>{s.plan}</span></td>
                  <td><span className="font-mono-cyber text-[11px] uppercase" style={{ color: statusColors[s.status] }}>{s.status}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("pt-BR") : "-"}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
