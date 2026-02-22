import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Send, MessageSquare, Zap } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message { role: "user" | "assistant"; content: string; }

const QUICK_PROMPTS = [
  "Criar prompt para bot de pagamento Sync Pay",
  "Como fazer bot que pega midias sem download local",
  "Otimizar bot distribuidor com postagem a cada 15min",
  "Criar bot criador de contas no Instagram",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = trpc.llm.chat.useMutation({
    onSuccess: (data) => { const content = typeof data.content === "string" ? data.content : ""; setMessages((prev) => [...prev, { role: "assistant", content }]); },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || chat.isPending) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    chat.mutate({ messages: newMessages });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="font-display text-xl"><span className="neon-pink">ASSISTENTE</span> <span className="neon-cyan">IA</span></h1>
        <p className="font-mono-cyber text-[11px] text-[#6b6b8a] mt-1">ESPECIALISTA EM AUTOMACAO DE BOTS - PROMPTS - TROUBLESHOOTING</p>
      </div>

      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(0,245,255,0.2))", border: "1px solid rgba(255,45,120,0.3)" }}>
              <MessageSquare size={24} className="text-[#ff2d78]" />
            </div>
            <p className="font-display text-sm text-[#e0e0f0] mb-1">Como posso ajudar?</p>
            <p className="font-mono-cyber text-[11px] text-[#6b6b8a]">Peca prompts para criar bots, tire duvidas ou peca otimizacoes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} onClick={() => sendMessage(p)}
                className="text-left px-4 py-3 rounded-sm border border-[#1a1a2e] hover:border-[#ff2d78] text-[#6b6b8a] hover:text-[#e0e0f0] transition-all text-xs font-mono-cyber">
                <Zap size={10} className="inline mr-2 text-[#ff2d78]" />{p}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] rounded-sm px-4 py-3 text-[#e0e0f0]"
                style={msg.role === "user"
                  ? { background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.2)" }
                  : { background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}>
                <div className="font-mono-cyber text-[9px] uppercase mb-2" style={{ color: msg.role === "user" ? "#ff2d78" : "#00f5ff" }}>
                  {msg.role === "user" ? "VOCE" : "ASSISTENTE IA"}
                </div>
                {msg.role === "assistant" ? (
                  <div className="text-sm prose prose-invert max-w-none"><Streamdown>{msg.content}</Streamdown></div>
                ) : (
                  <p className="text-sm font-mono-cyber">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-sm" style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}>
                <div className="flex gap-1">
                  {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          className="flex-1 bg-[#0a0a0f] border border-[#1a1a2e] rounded-sm px-4 py-3 text-sm text-[#e0e0f0] focus:border-[#ff2d78] focus:outline-none font-mono-cyber placeholder-[#6b6b8a]"
          placeholder="Pergunte sobre bots, prompts ou automacao..." />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || chat.isPending}
          className="px-4 py-3 rounded-sm text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #ff2d78, #c0006a)", border: "1px solid #ff2d78" }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
