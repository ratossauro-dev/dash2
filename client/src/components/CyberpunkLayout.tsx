import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, Bot, Film, Users, CreditCard, Share2, FileText, MessageSquare,
  Bell, Settings, ChevronLeft, ChevronRight, Activity, Zap, LogOut, Menu, X, Key, Lock
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview", color: "pink" },
  { href: "/bots", icon: Bot, label: "Bots", color: "cyan" },
  { href: "/tokens", icon: Key, label: "API Tokens", color: "pink" },
  { href: "/media", icon: Film, label: "Mídias", color: "cyan" },
  { href: "/subscribers", icon: Users, label: "Assinantes", color: "cyan" },
  { href: "/payments", icon: CreditCard, label: "Pagamentos", color: "pink" },
  { href: "/social", icon: Share2, label: "Contas Sociais", color: "cyan" },
  { href: "/prompts", icon: FileText, label: "Prompts", color: "pink" },
  { href: "/assistant", icon: MessageSquare, label: "Assistente IA", color: "cyan" },
];

function NavItem({ href, icon: Icon, label, color, collapsed }: {
  href: string; icon: React.ElementType; label: string; color: string; collapsed: boolean;
}) {
  const [location] = useLocation();
  const isActive = location === href;
  const isPink = color === "pink";

  return (
    <Link href={href}>
      <div className={`
        flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all duration-200 group relative
        ${isActive
          ? isPink
            ? "bg-[rgba(255,45,120,0.12)] border border-[rgba(255,45,120,0.3)]"
            : "bg-[rgba(0,245,255,0.08)] border border-[rgba(0,245,255,0.2)]"
          : "border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.06)]"
        }
      `}>
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r ${isPink ? "bg-[#ff2d78]" : "bg-[#00f5ff]"}`}
            style={{ boxShadow: isActive ? `0 0 8px ${isActive ? (isActive && isActive ? (isActive ? (isActive ? (isActive ? (isActive ? (isActive ? (isActive ? "#ff2d78" : "#00f5ff") : "#00f5ff") : "#00f5ff") : "#00f5ff") : "#00f5ff") : "#00f5ff") : "#00f5ff") : "#00f5ff"}` : "" }}
          />
        )}
        <Icon
          size={16}
          className={`shrink-0 transition-all ${isActive
            ? isActive && isActive ? (isActive ? (isActive ? (isActive ? (isActive ? (isActive ? (isActive ? "text-[#ff2d78]" : "text-[#00f5ff]") : "text-[#00f5ff]") : "text-[#00f5ff]") : "text-[#00f5ff]") : "text-[#00f5ff]") : "text-[#00f5ff]") : "text-[#00f5ff]"
            : "text-[#6b6b8a] group-hover:text-[#e0e0f0]"
            }`}
          style={isActive ? { color: isActive ? (color === "pink" ? "#ff2d78" : "#00f5ff") : undefined, filter: isActive ? `drop-shadow(0 0 6px ${color === "pink" ? "#ff2d78" : "#00f5ff"})` : undefined } : {}}
        />
        {!collapsed && (
          <span className={`text-sm font-medium tracking-wide transition-colors ${isActive ? "text-[#e0e0f0]" : "text-[#6b6b8a] group-hover:text-[#e0e0f0]"}`}
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {label}
          </span>
        )}
        {!collapsed && isActive && (
          <div className="ml-auto">
            <Zap size={10} style={{ color: color === "pink" ? "#ff2d78" : "#00f5ff" }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CyberpunkLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, loading, revalidate } = useAuth();
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [time, setTime] = useState(new Date());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success("Acesso autorizado");
        if (revalidate) await revalidate();
      } else {
        toast.error("Senha incorreta");
      }
    } catch (err) {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: isAuthenticated,
  });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-2xl neon-pink mb-4">CARREGANDO</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#ff2d78] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <div className="cyber-card p-8 max-w-sm w-full text-center">
          <div className="font-display text-3xl neon-pink mb-2">BOT</div>
          <div className="font-display text-3xl neon-cyan mb-6">DASHBOARD</div>
          <p className="text-[#6b6b8a] text-sm mb-8 font-mono-cyber">SISTEMA DE CONTROLE CENTRALIZADO</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a]" size={16} />
              <input
                type="password"
                placeholder="SENHA DO SISTEMA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a15] border border-[#1a1a2e] rounded-sm py-2.5 pl-10 pr-4 text-sm font-mono-cyber text-[#e0e0f0] focus:outline-none focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 text-center font-display text-xs tracking-widest uppercase text-white rounded-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78", boxShadow: "0 0 20px rgba(255,45,120,0.3)" }}>
              {isLoggingIn ? "AUTENTICANDO..." : "ACESSAR SISTEMA"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 border-b border-[#1a1a2e] ${collapsed ? "items-center" : ""}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #ff2d78, #9d4edd)", boxShadow: "0 0 12px rgba(255,45,120,0.4)" }}>
            <Activity size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display text-xs neon-pink leading-none">BOT</div>
              <div className="font-display text-xs neon-cyan leading-none">DASHBOARD</div>
            </div>
          )}
        </div>
      </div>

      {/* System time */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-[#1a1a2e]">
          <div className="font-mono-cyber text-[10px] text-[#6b6b8a]">SYS_TIME</div>
          <div className="font-mono-cyber text-[11px] text-[#00f5ff]">{time.toLocaleTimeString("pt-BR")}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User info */}
      <div className={`p-3 border-t border-[#1a1a2e] ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-display shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(0,245,255,0.2))", border: "1px solid rgba(255,45,120,0.3)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#e0e0f0] truncate font-medium">{user?.name ?? "Admin"}</div>
              <div className="text-[10px] text-[#6b6b8a] font-mono-cyber">{user?.role?.toUpperCase()}</div>
            </div>
            <a href="/api/trpc/auth.logout" className="text-[#6b6b8a] hover:text-[#ff2d78] transition-colors">
              <LogOut size={14} />
            </a>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-display"
            style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(0,245,255,0.2))", border: "1px solid rgba(255,45,120,0.3)" }}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-[#1a1a2e] flex items-center justify-center text-[#6b6b8a] hover:text-[#ff2d78] transition-colors w-full"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050508] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 border-r border-[#1a1a2e] ${collapsed ? "w-16" : "w-56"}`}
        style={{ background: "var(--cyber-dark)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 h-full border-r border-[#1a1a2e]" style={{ background: "var(--cyber-dark)" }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="shrink-0 h-12 border-b border-[#1a1a2e] flex items-center justify-between px-4"
          style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden text-[#6b6b8a] hover:text-[#ff2d78]" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse-green" />
              <span className="font-mono-cyber text-[10px] text-[#6b6b8a]">SISTEMA OPERACIONAL</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifications">
              <button className="relative text-[#6b6b8a] hover:text-[#ff2d78] transition-colors p-1">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-display flex items-center justify-center text-white"
                    style={{ background: "#ff2d78", boxShadow: "0 0 8px rgba(255,45,120,0.6)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/settings">
              <button className="text-[#6b6b8a] hover:text-[#00f5ff] transition-colors p-1">
                <Settings size={16} />
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
