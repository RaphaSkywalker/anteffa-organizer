import { useI18n } from "@/contexts/I18nContext";
import { Calendar as CalendarIcon, Plus, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

const mockEvents = [
  { title: "Sprint Planning", time: "09:00 - 10:00", location: "Sala 1", color: "bg-primary/15 border-primary/30", participants: 8 },
  { title: "Daily Standup", time: "10:30 - 10:45", location: "Virtual", color: "bg-accent/15 border-accent/30", participants: 12 },
  { title: "Design Review", time: "14:00 - 15:00", location: "Sala 3", color: "bg-warning/15 border-warning/30", participants: 5 },
  { title: "1:1 com Liderança", time: "16:00 - 16:30", location: "Sala 2", color: "bg-success/15 border-success/30", participants: 2 },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];

export default function AgendaPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("agenda.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Fevereiro 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> {t("agenda.newEvent")}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div {...fadeIn} className="lg:col-span-2 glass-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {t("agenda.today")} — 24 Fev 2026
            </h2>
          </div>
          <div className="divide-y divide-border">
            {mockEvents.map((event, i) => (
              <div key={i} className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors`}>
                <div className={`w-1 h-12 rounded-full ${event.color.replace("/15", "")} mt-0.5`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {event.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(event.participants, 3) }).map((_, j) => (
                    <div key={j} className="w-6 h-6 rounded-full bg-muted border-2 border-card" />
                  ))}
                  {event.participants > 3 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                      +{event.participants - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mini Week View */}
        <motion.div {...fadeIn} className="glass-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Semana</h2>
          <div className="grid grid-cols-5 gap-2">
            {weekDays.map((day, i) => (
              <div key={day} className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">{day}</p>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium mx-auto transition-colors ${
                    i === 0
                      ? "gradient-brand text-primary-foreground"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  {24 + i}
                </div>
                {i < 3 && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {Array.from({ length: i + 1 }).map((_, j) => (
                      <div key={j} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
