import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Share2, Plus, RefreshCw, Twitter, Instagram } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = { active: "#39ff14", banned: "#ff3131", suspended: "#f5e642", unverified: "#6b6b8a", error: "#ff3131" };
const PLATFORMS = ["twitter", "instagram"] as const;
type Platform = typeof PLATFORMS[number];

export default function SocialAccounts() {
  const [activePlatform, setActivePlatform] = useState<"all" | Platform>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "twitter" as Platform, username: "", email: "", phone: "", proxyUsed: "" });

  const { data: accounts, isLoading, refetch } = trpc.socialAccounts.list.useQuery({ limit: 100 }, { refetchInterval: 30000 });
  const add = trpc.socialAccounts.add.useMutation({ onSuccess: () => { toast.success("Conta adicionada!"); setShowForm(false); refetch(); }, onError: (e) => toast.error(e.message) });
  const updateStatus = trpc.socialAccounts.updateStatus.useMutation({ onSuccess: () => refetch() });

  const filtered = accounts?.filter((a) => activePlatform === "all" || a.platform === activePlatform);
  const twitterCount = accounts?.filter((a) => a.platform === "twitter").length ?? 0;
  const instagramCount = accounts?.filter((a) => a.platform === "instagram").length ?? 0;
  const activeCount = accounts?.filter((a) => a.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">CONTAS</span> <span className="neon-cyan">SOCIAIS</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">X (TWITTER) + INSTAGRAM - CRIADAS AUTOMATICAMENTE</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 border border-[#1a1a2e] rounded-sm text-[#6b6b8a] hover:text-[#00f5ff] hover:border-[#00f5ff] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
            <Plus size={12} /> Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total", value: accounts?.length ?? 0, color: "#e0e0f0" }, { label: "Ativas", value: activeCount, color: "#39ff14" }, { label: "Twitter", value: twitterCount, color: "#00f5ff" }, { label: "Instagram", value: instagramCount, color: "#ff2d78" }].map((s) => (
          <div key={s.label} className="cyber-card p-4 rounded-sm text-center">
            <div className="font-display text-2xl font-bold mb-1" style={{ color: s.color, textShadow: `0 0 15px ${s.color}` }}>{s.value}</div>
            <div className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="cyber-card p-5 rounded-sm">
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Adicionar Conta Social</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Plataforma</label>
              <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber">
                <option value="twitter">Twitter / X</option><option value="instagram">Instagram</option>
              </select>
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Username</label>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="@usuario" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">Proxy</label>
              <input value={form.proxyUsed} onChange={(e) => setForm((f) => ({ ...f, proxyUsed: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber" placeholder="ip:porta" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => add.mutate(form)} disabled={add.isPending || !form.username.trim()}
              className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
              {add.isPending ? "Adicionando..." : "Adicionar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-[#1a1a2e]">
        {(["all", "twitter", "instagram"] as const).map((p) => (
          <button key={p} onClick={() => setActivePlatform(p)}
            className={`px-4 py-2 font-mono-cyber text-[11px] uppercase tracking-widest transition-all ${activePlatform === p ? "text-[#ff2d78] border-b-2 border-[#ff2d78]" : "text-[#6b6b8a] hover:text-[#e0e0f0]"}`}>
            {p === "all" ? "Todas" : p === "twitter" ? "Twitter / X" : "Instagram"}
          </button>
        ))}
      </div>

      <div className="cyber-card rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full cyber-table">
            <thead><tr><th className="text-left">Plataforma</th><th className="text-left">Username</th><th className="text-left">Email</th><th className="text-left">Status</th><th className="text-left">Seguidores</th><th className="text-left">Posts</th><th className="text-left">Ultimo Post</th><th className="text-left">Acao</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 font-mono-cyber text-[#6b6b8a]">Carregando...</td></tr>}
              {!isLoading && (!filtered || filtered.length === 0) && <tr><td colSpan={8} className="text-center py-12"><Share2 size={24} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" /><p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhuma conta cadastrada</p></td></tr>}
              {filtered?.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {a.platform === "twitter" ? <Twitter size={14} className="text-[#00f5ff]" /> : <Instagram size={14} className="text-[#ff2d78]" />}
                      <span className="font-mono-cyber text-[11px] uppercase" style={{ color: a.platform === "twitter" ? "#00f5ff" : "#ff2d78" }}>{a.platform}</span>
                    </div>
                  </td>
                  <td><span className="font-mono-cyber text-[11px] text-[#e0e0f0]">@{a.username}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{a.email ?? "-"}</span></td>
                  <td><span className="font-mono-cyber text-[11px] uppercase" style={{ color: statusColors[a.status] }}>{a.status}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#00f5ff]">{a.followersCount.toLocaleString()}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{a.postsCount}</span></td>
                  <td><span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{a.lastPostAt ? new Date(a.lastPostAt).toLocaleDateString("pt-BR") : "-"}</span></td>
                  <td>
                    <select value={a.status} onChange={(e) => updateStatus.mutate({ id: a.id, status: e.target.value as "active" | "banned" | "suspended" | "unverified" | "error" })}
                      className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-2 py-1 text-[11px] font-mono-cyber text-[#6b6b8a] focus:outline-none">
                      <option value="active">active</option><option value="unverified">unverified</option><option value="suspended">suspended</option><option value="banned">banned</option><option value="error">error</option>
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
