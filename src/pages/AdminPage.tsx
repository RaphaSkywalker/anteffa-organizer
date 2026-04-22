import { API_URL } from "../config";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Cake, Calendar, Trash2, Loader2, Search, PlusCircle, LayoutGrid, Edit3, XCircle, RefreshCw, CheckCircle2, ChevronDown, Megaphone, AlertCircle, TrendingUp, TrendingDown, FileText, ChevronRight, PieChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { safeDate } from "@/lib/utils";
import { exportEmployeePDF } from "@/lib/reportUtils";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type Tab = "employees" | "teams" | "birthdays" | "dates" | "bulletins";

export default function AdminPage() {
  const { api, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("employees");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Lists
  const [employees, setEmployees] = useState<any[]>([]);
                const val = (item.name || item.title || item.username || "").toLowerCase();
                return val.includes(searchTerm.toLowerCase());
              });

              if (filtered.length === 0) {
                return (
                  <div className="col-span-full py-16 text-center glass-card rounded-[2rem] border border-dashed border-border/60">
                    <p className="text-muted-foreground font-semibold">Nenhum registro encontrado</p>
                  </div>
                );
              }

              return filtered.map((item) => (
                <motion.div layout key={`${activeTab}-${item.id}`} className="glass-card rounded-[1.2rem] border border-border p-4 flex items-center gap-3 group hover:border-primary/50 transition-all shadow-md overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${activeTab === 'teams' ? '' : 'bg-primary/20 group-hover:bg-primary transition-colors'}`} style={activeTab === 'teams' ? { backgroundColor: item.color || '#3b82f6' } : {}} />

                  <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground font-bold shrink-0 overflow-hidden shadow-md">
                      {item.avatar_url ? (
                        <img src={`${API_URL}${item.avatar_url}`} className="w-full h-full object-cover" />
                      ) : (
                        (item.name || item.title || item.username || "U")[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground truncate" title={item.name || item.title || item.username}>
                        {item.name || item.title || item.username}
                      </h3>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 truncate">
                        {activeTab === "employees" ? (
                          <>
                            <span className="font-bold text-primary shrink-0">{item.team_name || "Sem Equipe"}</span>
                            <span className="opacity-50">|</span>
                            <span className="truncate">{item.email}</span>
                          </>
                        ) : activeTab === "teams" ? (
                          <span className="truncate">{item.description || "Sem descrição"}</span>
                        ) : activeTab === "birthdays" ? (
                          <span className="truncate">{safeDate(item.birth_date).toLocaleDateString('pt-BR')} • {item.department}</span>
                        ) : activeTab === "dates" ? (
                          <div className="text-[10px] text-muted-foreground flex flex-col gap-1 mt-0.5">
                            <span className="truncate flex items-center gap-2">
                              {safeDate(item.event_date).toLocaleDateString('pt-BR')}
                              {item.is_recurring && (
                                <span className="flex items-center gap-1 text-primary font-bold">
                                  <RefreshCw className="w-3 h-3 animate-spin-slow" /> ANUAL
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                              {item.date_type === 'feriado' ? <span className="text-green-500">Feriado</span> :
                               item.date_type === 'facultativo' ? <span className="text-yellow-500">Ponto Facultativo</span> :
                               item.date_type === 'lua' ? <span className="text-purple-400">Fases da Lua</span> :
                               <span className="text-slate-400">Data Comemorativa</span>}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground flex flex-col gap-1 mt-0.5">
                            <span className="font-bold text-primary uppercase">{item.category}</span>
                            <span className="truncate opacity-70 italic">"{item.content}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-all shadow-sm"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activeTab, item.id)}
                      className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all shadow-sm"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ));
            })()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

