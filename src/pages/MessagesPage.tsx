import { useI18n } from "@/contexts/I18nContext";
import { Mail, Star, Archive, Send as SendIcon, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type Tab = "inbox" | "sent" | "archived";

const mockInbox = [
  { from: "Maria Silva", subject: "Relatório Q4 finalizado", preview: "Oi, segue o relatório revisado...", time: "09:15", unread: true, important: true },
  { from: "Time Produto", subject: "Sprint Review - Resumo", preview: "Seguem os pontos principais...", time: "Ontem", unread: true, important: false },
  { from: "João Pereira", subject: "Dúvida sobre deploy", preview: "Preciso de ajuda com o pipeline...", time: "Ontem", unread: false, important: false },
  { from: "Ana Lima", subject: "Convite: Workshop UX", preview: "Gostaria de convidar vocês para...", time: "22 Fev", unread: false, important: true },
];

export default function MessagesPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("inbox");

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "inbox", label: t("messages.inbox"), icon: Mail, count: 2 },
    { key: "sent", label: t("messages.sent"), icon: SendIcon },
    { key: "archived", label: t("messages.archived"), icon: Archive },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("messages.title")}</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> {t("messages.compose")}
        </button>
      </motion.div>

      <motion.div {...fadeIn}>
        <div className="flex gap-1 border-b border-border mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count && (
                <span className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-xl border border-border divide-y divide-border">
          {mockInbox.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer",
                msg.unread && "bg-primary/[0.03]"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {msg.from.split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm truncate", msg.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {msg.from}
                  </p>
                  {msg.important && <Star className="w-3.5 h-3.5 text-warning fill-warning shrink-0" />}
                </div>
                <p className={cn("text-sm truncate", msg.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {msg.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">{msg.preview}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{msg.time}</span>
                {msg.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
