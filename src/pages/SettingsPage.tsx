import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências da conta</p>
      </motion.div>

      <motion.div {...fadeIn} className="glass-card rounded-xl border border-border p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Perfil</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
              <input className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground" value="Usuário" readOnly />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
              <input className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground" value="user@anteffa.com" readOnly />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Notificações</h3>
          <div className="space-y-3">
            {["E-mail", "Push", "Chat"].map((n) => (
              <div key={n} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{n}</span>
                <div className="w-10 h-5 rounded-full bg-primary/30 relative cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-primary absolute top-0.5 right-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
