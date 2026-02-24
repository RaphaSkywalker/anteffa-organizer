import { motion } from "framer-motion";
import { Shield, Users, Settings as SettingsIcon } from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de usuários e permissões</p>
      </motion.div>

      <motion.div {...fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "Usuários", desc: "32 ativos", color: "bg-primary/15 text-primary" },
          { icon: Shield, title: "Permissões", desc: "3 perfis", color: "bg-accent/15 text-accent" },
          { icon: SettingsIcon, title: "Configurações", desc: "Sistema", color: "bg-warning/15 text-warning" },
        ].map((card, i) => (
          <div key={i} className="glass-card rounded-xl border border-border p-6 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color} mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">{card.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn} className="glass-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Usuários Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { name: "Maria Silva", email: "maria@anteffa.com", role: "Admin", status: "Ativo" },
            { name: "João Pereira", email: "joao@anteffa.com", role: "Usuário", status: "Ativo" },
            { name: "Ana Lima", email: "ana@anteffa.com", role: "Usuário", status: "Ativo" },
            { name: "Carlos Ribeiro", email: "carlos@anteffa.com", role: "Moderador", status: "Inativo" },
          ].map((user, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {user.name.split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">{user.role}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.status === "Ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {user.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
