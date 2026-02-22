import { trpc } from "@/lib/trpc";
import { Bell, AlertTriangle, DollarSign, UserPlus, Film, UserCheck, XCircle, CheckCheck } from "lucide-react";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  bot_down: { icon: AlertTriangle, color: "#ff3131", label: "Bot Offline" },
  payment_received: { icon: DollarSign, color: "#39ff14", label: "Pagamento" },
  error_critical: { icon: XCircle, color: "#ff3131", label: "Erro Critico" },
  new_subscriber: { icon: UserPlus, color: "#00f5ff", label: "Novo Assinante" },
  media_posted: { icon: Film, color: "#ff2d78", label: "Midia Postada" },
  account_created: { icon: UserCheck, color: "#39ff14", label: "Conta Criada" },
};

export default function Notifications() {
  const { data: notifs, isLoading, refetch } = trpc.notifications.list.useQuery({ limit: 100 }, { refetchInterval: 30000 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { toast.success("Todas marcadas como lidas"); refetch(); } });

  const unread = notifs?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">CENTRAL</span> <span className="neon-cyan">DE NOTIFICACOES</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">{unread} NAO LIDAS - {notifs?.length ?? 0} TOTAL</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase border border-[#00f5ff] text-[#00f5ff] hover:bg-[rgba(0,245,255,0.1)] transition-all">
            <CheckCheck size={12} /> Marcar Todas Lidas
          </button>
        )}
      </div>

      <div className="cyber-card rounded-sm overflow-hidden">
        {isLoading && <div className="text-center py-12 font-mono-cyber text-[#6b6b8a]">Carregando...</div>}
        {!isLoading && (!notifs || notifs.length === 0) && (
          <div className="text-center py-16">
            <Bell size={32} className="mx-auto mb-3 text-[#6b6b8a] opacity-30" />
            <p className="font-mono-cyber text-[12px] text-[#6b6b8a]">Nenhuma notificacao</p>
          </div>
        )}
        <div className="divide-y divide-[#1a1a2e]">
          {notifs?.map((n) => {
            const cfg = typeConfig[n.type] ?? { icon: Bell, color: "#6b6b8a", label: n.type };
            const Icon = cfg.icon;
            return (
              <div key={n.id} onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-all hover:bg-[rgba(255,45,120,0.02)] ${!n.isRead ? "border-l-2 border-[#ff2d78]" : ""}`}>
                <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-cyber text-[10px] uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78]" style={{ boxShadow: "0 0 6px #ff2d78" }} />}
                  </div>
                  <p className="text-sm text-[#e0e0f0] font-medium">{n.title}</p>
                  <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-0.5">{n.message}</p>
                </div>
                <span className="font-mono-cyber text-[10px] text-[#6b6b8a] shrink-0">{new Date(n.createdAt).toLocaleString("pt-BR")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
