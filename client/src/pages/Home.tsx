import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Activity, Bot, Film, Users, CreditCard, Share2, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const mockActivityData = [
  { time: "00:00", midias: 4, pagamentos: 1 },
  { time: "03:00", midias: 2, pagamentos: 0 },
  { time: "06:00", midias: 8, pagamentos: 2 },
  { time: "09:00", midias: 15, pagamentos: 3 },
  { time: "12:00", midias: 22, pagamentos: 5 },
  { time: "15:00", midias: 18, pagamentos: 4 },
  { time: "18:00", midias: 30, pagamentos: 7 },
  { time: "21:00", midias: 25, pagamentos: 6 },
  { time: "Agora", midias: 12, pagamentos: 2 },
];

function StatCard({ icon: Icon, label, value, sub, color, glow }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; glow: string;
}) {
  return (
    <div className="cyber-card p-4 rounded-sm relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 80% 20%, ${color}, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[9px] tracking-widest uppercase text-[#6b6b8a]">{label}</span>
          <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: `rgba(${glow}, 0.15)`, border: `1px solid rgba(${glow}, 0.3)` }}>
            <Icon size={14} style={{ color }} />
          </div>
        </div>
        <div className="font-display text-2xl font-bold mb-1" style={{ color, textShadow: `0 0 20px rgba(${glow}, 0.5)` }}>
          {value}
        </div>
        {sub && <div className="font-mono-cyber text-[10px] text-[#6b6b8a]">{sub}</div>}
      </div>
    </div>
  );
}

function BotStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "#39ff14", offline: "#6b6b8a", error: "#ff3131", idle: "#f5e642"
  };
  const color = colors[status] ?? "#6b6b8a";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="font-mono-cyber text-[11px] uppercase" style={{ color }}>{status}</span>
    </span>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = trpc.stats.overview.useQuery(undefined, { refetchInterval: 30000 });
  const { data: bots } = trpc.bots.list.useQuery(undefined, { refetchInterval: 30000 });
  const { data: recentLogs } = trpc.bots.getLogs.useQuery({ limit: 8 }, { refetchInterval: 30000 });
  const { data: notifications } = trpc.notifications.list.useQuery({ limit: 5 });

  const botStatusData = useMemo(() => {
    if (!bots) return [];
    const counts = { online: 0, offline: 0, error: 0, idle: 0 };
    bots.forEach(b => { counts[b.status] = (counts[b.status] ?? 0) + 1; });
    return [
      { name: "Online", value: counts.online, color: "#39ff14" },
      { name: "Offline", value: counts.offline, color: "#6b6b8a" },
      { name: "Erro", value: counts.error, color: "#ff3131" },
      { name: "Idle", value: counts.idle, color: "#f5e642" },
    ].filter(d => d.value > 0);
  }, [bots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-[#e0e0f0]">
            <span className="neon-pink">SISTEMA</span> <span className="neon-cyan">OVERVIEW</span>
          </h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">MONITORAMENTO EM TEMPO REAL · ATUALIZAÇÃO A CADA 30S</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#1a1a2e]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse-green" />
          <span className="font-mono-cyber text-[10px] text-[#39ff14]">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Bot} label="Bots Online" value={statsLoading ? "..." : `${stats?.botsOnline ?? 0}/${stats?.botsTotal ?? 0}`} sub="ativos agora" color="#ff2d78" glow="255,45,120" />
        <StatCard icon={Film} label="Mídias 24h" value={statsLoading ? "..." : stats?.mediaPosted24h ?? 0} sub="postadas hoje" color="#00f5ff" glow="0,245,255" />
        <StatCard icon={Users} label="Assinantes" value={statsLoading ? "..." : stats?.activeSubscribers ?? 0} sub="ativos" color="#39ff14" glow="57,255,20" />
        <StatCard icon={CreditCard} label="Receita 30d" value={statsLoading ? "..." : `R$${(stats?.revenue30d ?? 0).toFixed(0)}`} sub="últimos 30 dias" color="#f5e642" glow="245,230,66" />
        <StatCard icon={Share2} label="Contas Sociais" value={statsLoading ? "..." : stats?.socialAccounts ?? 0} sub="X + Instagram" color="#9d4edd" glow="157,78,221" />
        <StatCard icon={TrendingUp} label="Operações" value={bots?.reduce((a, b) => a + b.totalOperations, 0) ?? 0} sub="total acumulado" color="#ff6b35" glow="255,107,53" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="lg:col-span-2 cyber-card p-4 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase">Atividade do Sistema</h2>
            <span className="font-mono-cyber text-[10px] text-[#6b6b8a]">ÚLTIMAS 24H</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mockActivityData}>
              <defs>
                <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d78" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff2d78" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: "#6b6b8a", fontSize: 9, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b8a", fontSize: 9, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: "2px", fontFamily: "Rajdhani" }} labelStyle={{ color: "#6b6b8a", fontSize: 11 }} />
              <Area type="monotone" dataKey="midias" stroke="#ff2d78" strokeWidth={1.5} fill="url(#pinkGrad)" name="Mídias" />
              <Area type="monotone" dataKey="pagamentos" stroke="#00f5ff" strokeWidth={1.5} fill="url(#cyanGrad)" name="Pagamentos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bot Status Pie */}
        <div className="cyber-card p-4 rounded-sm">
          <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase mb-4">Status dos Bots</h2>
          {botStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={botStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {botStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {botStatusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="font-mono-cyber text-[11px] text-[#6b6b8a]">{d.name}</span>
                    </div>
                    <span className="font-display text-xs" style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-[#6b6b8a]">
              <Bot size={24} className="mb-2 opacity-40" />
              <p className="font-mono-cyber text-[11px]">Nenhum bot cadastrado</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bots List */}
        <div className="cyber-card rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a2e] flex items-center justify-between">
            <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase">Bots Ativos</h2>
            <a href="/bots" className="font-mono-cyber text-[10px] text-[#ff2d78] hover:underline">VER TODOS →</a>
          </div>
          <div className="divide-y divide-[#1a1a2e]">
            {bots && bots.length > 0 ? bots.slice(0, 6).map(bot => (
              <div key={bot.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-[rgba(255,45,120,0.02)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                    background: bot.status === "online" ? "#39ff14" : bot.status === "error" ? "#ff3131" : bot.status === "idle" ? "#f5e642" : "#6b6b8a",
                    boxShadow: bot.status === "online" ? "0 0 6px #39ff14" : bot.status === "error" ? "0 0 6px #ff3131" : "none"
                  }} />
                  <span className="font-medium text-sm text-[#e0e0f0] truncate">{bot.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono-cyber text-[10px] text-[#6b6b8a] hidden sm:block">{bot.type.replace("_", " ")}</span>
                  <BotStatusDot status={bot.status} />
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center">
                <Bot size={20} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" />
                <p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhum bot cadastrado ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="cyber-card rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a2e] flex items-center justify-between">
            <h2 className="font-display text-xs tracking-widest text-[#e0e0f0] uppercase">Notificações Recentes</h2>
            <a href="/notifications" className="font-mono-cyber text-[10px] text-[#00f5ff] hover:underline">VER TODAS →</a>
          </div>
          <div className="divide-y divide-[#1a1a2e]">
            {notifications && notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} className={`px-4 py-2.5 flex items-start gap-3 hover:bg-[rgba(0,245,255,0.02)] ${!n.isRead ? "bg-[rgba(255,45,120,0.02)]" : ""}`}>
                <div className={`mt-1 shrink-0 ${n.type === "bot_down" || n.type === "error_critical" ? "text-[#ff3131]" : n.type === "payment_received" ? "text-[#39ff14]" : "text-[#00f5ff]"}`}>
                  {n.type === "bot_down" || n.type === "error_critical" ? <AlertTriangle size={12} /> : <Zap size={12} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#e0e0f0] font-medium truncate">{n.title}</p>
                  <p className="font-mono-cyber text-[10px] text-[#6b6b8a] truncate">{n.message}</p>
                </div>
                {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] shrink-0 mt-1" />}
              </div>
            )) : (
              <div className="px-4 py-8 text-center">
                <Activity size={20} className="mx-auto mb-2 text-[#6b6b8a] opacity-40" />
                <p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
