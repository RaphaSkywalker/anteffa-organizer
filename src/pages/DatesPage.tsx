import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Cake, CalendarHeart, Send, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { safeDate } from "@/lib/utils";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

interface Birthday {
  id: number;
  name: string;
  birth_date: string;
  department: string;
  avatar_url?: string;
}

interface CompanyDate {
  id: number;
  title: string;
  event_date: string;
  description?: string;
  is_recurring?: boolean;
  date_type?: string;
}

export default function DatesPage() {
  const { t } = useI18n();
  const { api } = useAuth();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [companyDates, setCompanyDates] = useState<CompanyDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bdData, cdData] = await Promise.all([
          api("/api/birthdays"),
          api("/api/company-dates")
        ]);
        setBirthdays(bdData);
        setCompanyDates(cdData);
      } catch (error) {
        console.error("Error fetching dates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatBirthdayDate = (dateStr: string) => {
    try {
      const date = safeDate(dateStr);
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
    } catch (e) {
      return dateStr;
    }
  };

  const formatCompanyDate = (dateStr: string) => {
    try {
      const date = safeDate(dateStr);
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">{t("dates.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">Calendário completo de celebrações e marcos da Anteffa.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aniversariantes */}
        <motion.div {...fadeIn} className="glass-card rounded-[2rem] border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3 bg-accent/5">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Cake className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-bold text-foreground uppercase tracking-wider">{t("dates.birthdays")}</h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar divide-y divide-border">
            {birthdays.length > 0 ? (
              birthdays.map((b) => (
                <div key={b.id} className="group flex items-center gap-4 px-6 py-5 hover:bg-muted/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-black shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                    {b.avatar_url ? (
                      <img
                        src={`${API_URL}${b.avatar_url}`}
                        className="w-full h-full object-cover"
                        alt={b.name}
                      />
                    ) : (
                      b.name.split(" ").map((w) => w[0]).join("")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter opacity-70">
                      {b.department || "Geral"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-foreground uppercase">{formatBirthdayDate(b.birth_date)}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-lg">🎂</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                <Cake className="w-10 h-10 opacity-20" />
                <p>{loading ? "Carregando..." : "Nenhum aniversariante encontrado."}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Datas da Empresa */}
        <motion.div {...fadeIn} className="glass-card rounded-[2rem] border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3 bg-primary/5">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CalendarHeart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground uppercase tracking-wider">{t("dates.companyDates")}</h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar divide-y divide-border">
            {companyDates.length > 0 ? (
              companyDates.map((d) => (
                <div key={d.id} className="group flex items-start gap-4 px-6 py-5 hover:bg-muted/30 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${
                    d.date_type === 'feriado' ? 'bg-green-500/20' : 
                    d.date_type === 'facultativo' ? 'bg-yellow-500/20' : 
                    d.date_type === 'lua' ? 'bg-purple-500/20' : 
                    'bg-primary/20'
                  }`}>
                    {d.date_type === 'feriado' ? "🇧🇷" : d.date_type === 'facultativo' ? "🕒" : d.date_type === 'lua' ? "🌙" : "🏢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{d.title}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{d.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right flex flex-col items-end gap-1">
                    <p className={`text-xs font-black uppercase tracking-wider ${
                      d.date_type === 'feriado' ? 'text-green-600' : 
                      d.date_type === 'facultativo' ? 'text-yellow-600' : 
                      d.date_type === 'lua' ? 'text-purple-600' : 
                      'text-primary'
                    }`}>{formatCompanyDate(d.event_date)}</p>
                    {d.is_recurring && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-primary/60 uppercase">
                        <RefreshCw className="w-2.5 h-2.5" /> Anual
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                <CalendarHeart className="w-10 h-10 opacity-20" />
                <p>{loading ? "Carregando..." : "Nenhuma data comemorativa cadastrada."}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
