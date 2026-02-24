import { useI18n } from "@/contexts/I18nContext";
import { Users, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

const mockTeams = [
  { name: "Produto", members: 8, lead: "Maria Silva", color: "bg-primary/15 text-primary" },
  { name: "Engenharia", members: 12, lead: "Carlos Ribeiro", color: "bg-accent/15 text-accent" },
  { name: "Marketing", members: 5, lead: "Ana Lima", color: "bg-warning/15 text-warning" },
  { name: "Design", members: 4, lead: "Juliana Mendes", color: "bg-success/15 text-success" },
  { name: "Vendas", members: 6, lead: "Ricardo Alves", color: "bg-destructive/15 text-destructive" },
  { name: "RH", members: 3, lead: "Fernanda Costa", color: "bg-info/15 text-info" },
];

export default function TeamsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-foreground">{t("teams.title")}</h1>
      </motion.div>

      <motion.div {...fadeIn} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTeams.map((team) => (
          <div key={team.name} className="glass-card rounded-xl border border-border p-5 hover:scale-[1.01] transition-transform cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${team.color}`}>
                <Users className="w-5 h-5" />
              </div>
              <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-foreground text-lg">{team.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {team.members} {t("teams.members")} · Líder: {team.lead}
            </p>
            <div className="flex -space-x-2 mt-4">
              {Array.from({ length: Math.min(team.members, 5) }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card" />
              ))}
              {team.members > 5 && (
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                  +{team.members - 5}
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
