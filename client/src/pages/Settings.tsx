import { useState } from "react";
import { Save, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SettingField { label: string; key: string; placeholder: string; sensitive?: boolean; }
const settingGroups: { title: string; color: string; fields: SettingField[] }[] = [
  { title: "Telegram Bot Tokens", color: "#00f5ff", fields: [
    { label: "Bot Principal Token", key: "BOT_TOKEN", placeholder: "1234567890:AAF...", sensitive: true },
    { label: "Bot de Pagamento Token", key: "PAYMENT_BOT_TOKEN", placeholder: "1234567890:AAF...", sensitive: true },
    { label: "Bot Distribuidor Token", key: "DIST_BOT_TOKEN", placeholder: "1234567890:AAF...", sensitive: true },
  ]},
  { title: "Canais do Telegram", color: "#ff2d78", fields: [
    { label: "Canal Previa #novinha", key: "CANAL_NOVINHA", placeholder: "@canal_novinha" },
    { label: "Canal Previa #milf", key: "CANAL_MILF", placeholder: "@canal_milf" },
    { label: "Canal VIP", key: "CANAL_VIP", placeholder: "@canal_vip" },
    { label: "Canal Admin (Alertas)", key: "CANAL_ADMIN", placeholder: "@canal_admin" },
  ]},
  { title: "Sync Pay (Gateway PIX)", color: "#39ff14", fields: [
    { label: "API Key Sync Pay", key: "SYNCPAY_API_KEY", placeholder: "sk_live_...", sensitive: true },
    { label: "Webhook Secret", key: "SYNCPAY_WEBHOOK_SECRET", placeholder: "whsec_...", sensitive: true },
  ]},
  { title: "Configuracoes de Postagem", color: "#9d4edd", fields: [
    { label: "Intervalo de Postagem (min)", key: "POST_INTERVAL", placeholder: "15" },
    { label: "Max Posts por Hora", key: "MAX_POSTS_HOUR", placeholder: "4" },
    { label: "Categorias Ativas", key: "ACTIVE_CATEGORIES", placeholder: "#novinha,#milf,#gostosa" },
  ]},
];

export default function Settings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl"><span className="neon-pink">CONFIGURACOES</span> <span className="neon-cyan">DO SISTEMA</span></h1>
          <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">TOKENS - CANAIS - GATEWAY - POSTAGEM</p>
        </div>
        <button onClick={() => toast.success("Configuracoes salvas! Reinicie os bots para aplicar.")}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
          <Save size={12} /> Salvar
        </button>
      </div>

      <div className="cyber-card p-4 rounded-sm border-l-2 border-[#f5e642]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-[#f5e642] shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-[11px] text-[#f5e642] uppercase tracking-widest">Aviso de Seguranca</p>
            <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">Tokens e chaves de API sao dados sensiveis. Em producao, use variaveis de ambiente no servidor.</p>
          </div>
        </div>
      </div>

      {settingGroups.map((group) => (
        <div key={group.title} className="cyber-card rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1a1a2e]" style={{ borderLeftColor: group.color, borderLeftWidth: 2 }}>
            <h2 className="font-display text-xs tracking-widest uppercase" style={{ color: group.color }}>{group.title}</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="font-mono-cyber text-[10px] text-[#6b6b8a] uppercase block mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.sensitive && !visible[field.key] ? "password" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-3 py-2 text-sm text-[#e0e0f0] focus:outline-none font-mono-cyber pr-10"
                    style={{ borderColor: values[field.key] ? group.color : undefined }}
                    placeholder={field.placeholder}
                  />
                  {field.sensitive && (
                    <button onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#e0e0f0]">
                      {visible[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
