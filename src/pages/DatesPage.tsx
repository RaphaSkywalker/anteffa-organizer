import { useI18n } from "@/contexts/I18nContext";
import { Cake, CalendarHeart, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

const birthdays = [
  { name: "Fernanda Costa", date: "24 Fev", team: "RH" },
  { name: "Ricardo Alves", date: "25 Fev", team: "Vendas" },
  { name: "Juliana Mendes", date: "27 Fev", team: "Design" },
  { name: "Pedro Santos", date: "02 Mar", team: "Engenharia" },
  { name: "Larissa Oliveira", date: "08 Mar", team: "Marketing" },
];

const companyDates = [
  { title: "Aniversário da Empresa", date: "15 Mar", icon: "🏢" },
  { title: "Carnaval", date: "16-17 Fev", icon: "🎭" },
  { title: "Dia da Mulher", date: "08 Mar", icon: "💜" },
  { title: "Semana de Integração", date: "20-24 Mar", icon: "🤝" },
];

export default function DatesPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-foreground">{t("dates.title")}</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeIn} className="glass-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Cake className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">{t("dates.birthdays")}</h2>
          </div>
          <div className="divide-y divide-border">
            {birthdays.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {b.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.team}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{b.date}</p>
                  <span className="text-lg">🎂</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="glass-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("dates.companyDates")}</h2>
          </div>
          <div className="divide-y divide-border">
            {companyDates.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <span className="text-2xl">{d.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{d.date}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
