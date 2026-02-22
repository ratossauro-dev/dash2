import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreditCard, Plus, RefreshCw, QrCode } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { pending: "#f5e642", paid: "#39ff14", expired: "#6b6b8a", refunded: "#ff3131" };

export default function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ telegramId: "", amount: "", plan: "basic" as "basic" | "premium" | "vip" });

  const { data: paymentList, isLoading, refetch } = trpc.payments.list.useQuery({ limit: 100 }, { refetchInterval: 30000 });
  const { data: stats } = trpc.payments.stats.useQuery(undefined, { refetchInterval: 30000 });
  const create = trpc.payments.create.useMutation({ onSuccess: () => { toast.success("Cobranca gerada!"); setShowForm(false); refetch(); }, onError: (e) => toast.error(e.message) });
  const updateStatus = trpc.payments.updateStatus.useMutation({ onSuccess: () => refetch() });

  const statCards = [
    { label: "Total", value: stats?.total ?? 0, color: "#e0e0f0" },
    { label: "Pagos", value: stats?.paid ?? 0, color: "#39ff14" },
    { label: "Pendentes", value: stats?.pending ?? 0, color: "#f5e642" },
    { label: "Receita", value: `R$${(stats?.revenue ?? 0).toFixed(2)}`, color: "#ff2d78" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">PAGAMENTOS</span> <span className="neon-cyan">SYNC PAY</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">GATEWAY PIX - GERACAO DE QR CODE</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
            <Plus size={12} /> Gerar Cobranca
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
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Gerar Nova Cobranca</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Telegram ID</label>
              <input value={form.telegramId} onChange={(e) => setForm((f) => ({ ...f, telegramId: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="123456789" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Valor (R$)</label>
              <input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} type="number" step="0.01"
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="29.90" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Plano</label>
              <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as "basic" | "premium" | "vip" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="basic">Basic</option><option value="premium">Premium</option><option value="vip">VIP</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => create.mutate(form)} disabled={create.isPending || !form.amount || !form.telegramId}
              className="flex items-center gap-2 px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              <QrCode size={12} /> {create.isPending ? "Gerando..." : "Gerar QR Code"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
          <p className="font-mono-cyber text-[10px] text-[#6b6b8a] mt-3">Integracao com API Sync Pay sera ativada apos aprovacao da conta</p>
        </div>
      )}

      <div className="cyber-card rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full cyber-table">
            <thead><tr><th className="text-left">ID</th><th className="text-left">Telegram ID</th><th className="text-left">Plano</th><th className="text-left">Valor</th><th className="text-left">Status</th><th className="text-left">Gateway</th><th className="text-left">Data</th><th className="text-left">Acao</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 font-mono-cyber text-[#6b6b8a]">Carregando...</td></tr>}
              {!isLoading && (!paymentList || paymentList.length === 0) && <tr><td colSpan={8} className="text-center py-12"><CreditCard size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" /><p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum pagamento</p></td></tr>}
              {paymentList?.map((p) => (
                <tr key={p.id}>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">#{p.id}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#00f5ff]">{p.telegramId ?? "-"}</span></td>
                  <td><span className="font-mono-cyber text-[11px] uppercase text-[#e0e0f0]">{p.plan}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#39ff14]">R${Number(p.amount).toFixed(2)}</span></td>
                  <td><span className="font-mono-cyber text-[11px] uppercase" style={{ color: statusColors[p.status] }}>{p.status}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{p.gateway}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span></td>
                  <td>
                    <select value={p.status} onChange={(e) => updateStatus.mutate({ id: p.id, status: e.target.value as "pending" | "paid" | "expired" | "refunded" })}
                      className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-2 py-1 text-[11px] font-mono-cyber text-[#6b6b8a] focus:outline-none">
                      <option value="pending">pending</option><option value="paid">paid</option><option value="expired">expired</option><option value="refunded">refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
