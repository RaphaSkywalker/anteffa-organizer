import { useI18n } from "@/contexts/I18nContext";
import { Send, Search, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

const channels = [
  { name: "Geral", unread: 3, type: "group" },
  { name: "Produto", unread: 0, type: "group" },
  { name: "Marketing", unread: 1, type: "group" },
];

const contacts = [
  { name: "Maria Silva", status: "online", avatar: "MS" },
  { name: "João Pereira", status: "online", avatar: "JP" },
  { name: "Ana Lima", status: "offline", avatar: "AL" },
  { name: "Carlos Ribeiro", status: "away", avatar: "CR" },
];

const mockMessages = [
  { sender: "Maria Silva", text: "Pessoal, o relatório ficou pronto!", time: "09:15", self: false },
  { sender: "Você", text: "Ótimo! Vou revisar agora.", time: "09:17", self: true },
  { sender: "João Pereira", text: "Posso ajudar com a revisão se precisar.", time: "09:18", self: false },
  { sender: "Maria Silva", text: "Seria bom! O deadline é sexta.", time: "09:20", self: false },
];

const statusColors: Record<string, string> = {
  online: "bg-success",
  offline: "bg-muted-foreground/40",
  away: "bg-warning",
};

export default function ChatPage() {
  const { t } = useI18n();
  const [activeChannel, setActiveChannel] = useState("Geral");

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeIn} className="flex gap-0 h-[calc(100vh-8rem)] rounded-xl border border-border overflow-hidden glass-card">
        {/* Sidebar */}
        <div className="w-64 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/50 text-xs border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder={t("common.search")}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Canais</p>
            </div>
            {channels.map((ch) => (
              <button
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                  activeChannel === ch.name ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                <span className="font-medium"># {ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
            <div className="px-3 pt-4 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contatos</p>
            </div>
            {contacts.map((c) => (
              <button
                key={c.name}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{c.avatar}</div>
                  <Circle className={cn("w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current", statusColors[c.status])} style={{ color: 'transparent', stroke: 'none' }}>
                  </Circle>
                  <div className={cn("w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-card", statusColors[c.status])} />
                </div>
                <span className="font-medium truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-border flex items-center gap-3">
            <span className="text-lg font-semibold text-foreground"># {activeChannel}</span>
            <span className="text-xs text-muted-foreground">4 {t("chat.online").toLowerCase()}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {mockMessages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.self && "flex-row-reverse")}>
                {!msg.self && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {msg.sender.split(" ").map((w) => w[0]).join("")}
                  </div>
                )}
                <div className={cn("max-w-[60%]", msg.self ? "text-right" : "")}>
                  {!msg.self && <p className="text-xs font-medium text-foreground mb-1">{msg.sender}</p>}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm",
                    msg.self
                      ? "gradient-brand text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}>
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={t("chat.typeMessage")}
              />
              <button className="p-2.5 rounded-lg gradient-brand text-primary-foreground hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
