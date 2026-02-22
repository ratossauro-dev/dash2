import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Film, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = ["all", "pending", "posted", "failed", "skipped"] as const;
type StatusTab = typeof STATUS_TABS[number];

const categoryColors: Record<string, string> = {
  "#novinha": "#ff2d78", "#milf": "#9d4edd", "#teen": "#ff6b35",
  "#gostosa": "#00f5ff", "#safada": "#f5e642",
};

export default function Media() {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sourceUrl: "", mediaType: "video" as "video" | "image" | "gif", category: "", source: "erome" as "erome" | "telegram_clone" | "manual", targetChannel: "" });

  const { data: mediaList, isLoading, refetch } = trpc.media.list.useQuery(
    { status: activeTab === "all" ? undefined : activeTab as "pending" | "posted" | "failed" | "skipped", limit: 100 },
    { refetchInterval: 30000 }
  );
  const { data: stats } = trpc.media.stats.useQuery(undefined, { refetchInterval: 30000 });
  const addMedia = trpc.media.add.useMutation({ onSuccess: () => { toast.success("Midia adicionada!"); setShowForm(false); refetch(); }, onError: (e) => toast.error(e.message) });
  const updateStatus = trpc.media.updateStatus.useMutation({ onSuccess: () => refetch() });

  const statCards = [
    { label: "Total", value: stats?.total ?? 0, color: "#e0e0f0" },
    { label: "Pendentes", value: stats?.pending ?? 0, color: "#f5e642" },
    { label: "Postadas", value: stats?.posted ?? 0, color: "#39ff14" },
    { label: "Falhas", value: stats?.failed ?? 0, color: "#ff3131" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">FILA</span> <span className="neon-cyan">DE MIDIAS</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">GERENCIAMENTO DE CONTEUDO - SEM DOWNLOAD LOCAL</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
            <Plus size={12} /> Adicionar
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
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Adicionar Midia Manual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">URL da Midia</label>
              <input value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber"
                placeholder="https://erome.com/..." />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Tipo</label>
              <select value={form.mediaType} onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value as "video" | "image" | "gif" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="video">Video</option><option value="image">Imagem</option><option value="gif">GIF</option>
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Categoria</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber"
                placeholder="#novinha" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Fonte</label>
              <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as "erome" | "telegram_clone" | "manual" }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="erome">Erome</option><option value="telegram_clone">Telegram Clone</option><option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Canal Alvo</label>
              <input value={form.targetChannel} onChange={(e) => setForm((f) => ({ ...f, targetChannel: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber"
                placeholder="@canal_previa" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => addMedia.mutate(form)} disabled={addMedia.isPending || !form.sourceUrl.trim()}
              className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              {addMedia.isPending ? "Adicionando..." : "Adicionar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-[#1a1a2e]">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono-cyber text-[11px] uppercase tracking-widest transition-all ${activeTab === tab ? "text-[#ff2d78] border-b-2 border-[#ff2d78]" : "text-[#6b6b8a] hover:text-[#e0e0f0]"}`}>
            {tab === "all" ? "Todas" : tab}
          </button>
        ))}
      </div>

      <div className="cyber-card rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full cyber-table">
            <thead><tr><th className="text-left">ID</th><th className="text-left">Tipo</th><th className="text-left">Categoria</th><th className="text-left">Fonte</th><th className="text-left">Status</th><th className="text-left">Canal</th><th className="text-left">Data</th><th className="text-left">Acao</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 font-mono-cyber text-[#6b6b8a]">Carregando...</td></tr>}
              {!isLoading && (!mediaList || mediaList.length === 0) && (
                <tr><td colSpan={8} className="text-center py-12"><Film size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" /><p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhuma midia na fila</p></td></tr>
              )}
              {mediaList?.map((m) => (
                <tr key={m.id}>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">#{m.id}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#00f5ff] uppercase">{m.mediaType}</span></td>
                  <td>
                    {m.category ? (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-cyber" style={{ background: `${categoryColors[m.category] ?? "#6b6b8a"}20`, color: categoryColors[m.category] ?? "#6b6b8a", border: `1px solid ${categoryColors[m.category] ?? "#6b6b8a"}40` }}>
                        {m.category}
                      </span>
                    ) : <span className="text-[#6b6b8a] text-[11px]">-</span>}
                  </td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a] uppercase">{m.source}</span></td>
                  <td>
                    <span className="font-mono-cyber text-[11px] uppercase" style={{ color: m.status === "posted" ? "#39ff14" : m.status === "pending" ? "#f5e642" : m.status === "failed" ? "#ff3131" : "#6b6b8a" }}>
                      {m.status}
                    </span>
                  </td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{m.targetChannel ?? "-"}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</span></td>
                  <td>
                    <select value={m.status} onChange={(e) => updateStatus.mutate({ id: m.id, status: e.target.value as "pending" | "posted" | "failed" | "skipped" })}
                      className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-2 py-1 text-[11px] font-mono-cyber text-[#6b6b8a] focus:outline-none">
                      <option value="pending">pending</option><option value="posted">posted</option><option value="failed">failed</option><option value="skipped">skipped</option>
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
