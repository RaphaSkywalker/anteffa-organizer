import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Cake, Calendar, Trash2, Loader2, Search, PlusCircle, LayoutGrid, Edit3, XCircle, RefreshCw, CheckCircle2, ChevronDown, Megaphone, AlertCircle, TrendingUp, TrendingDown, FileText, ChevronRight, PieChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { safeDate } from "@/lib/utils";
import { exportEmployeePDF } from "@/lib/reportUtils";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type Tab = "employees" | "teams" | "birthdays" | "dates" | "bulletins" | "management";

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
  const [teams, setTeams] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);

  const [companyDates, setCompanyDates] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [managementStats, setManagementStats] = useState<any>({ total_absences: 0, total_certificates: 0, total_positive_hours: 0, total_negative_hours: 0 });
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, tms, bdays, cdates, bulls, abs] = await Promise.all([
        api("/api/admin/employees").catch(() => []),
        api("/api/teams").catch(() => []),
        api("/api/birthdays").catch(() => []),
        api("/api/company-dates").catch(() => []),
        api("/api/bulletins").catch(() => []),
        api("/api/admin/absences").catch(() => [])
      ]);

      setEmployees(emps || []);
      setTeams(tms || []);
      setBirthdays(bdays || []);
      setCompanyDates(cdates || []);
      setBulletins(bulls || []);
      setAbsences(abs || []);


      if (user?.role === "admin" || user?.team_name === "Financeiro" || user?.team_name === "Presidência") {
        const stats = await api(`/api/admin/management/stats?month=${(new Date().getMonth() + 1).toString().padStart(2, '0')}&year=${new Date().getFullYear()}`).catch(() => null);
        if (stats) setManagementStats(stats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados administrativa", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()) as any;
    
    // Explicitly handle the recurring checkbox and date_type
    if (activeTab === "dates") {
      const isRecurring = form.elements.namedItem('is_recurring') as HTMLInputElement;
      data.is_recurring = isRecurring?.checked || false;
      
      const dateType = form.elements.namedItem('date_type') as HTMLSelectElement;
      data.date_type = dateType?.value || 'comemorativa';
    }

    try {
      let endpoint = "";
      let method = editingItem ? "PUT" : "POST";

      if (activeTab === "employees") endpoint = editingItem ? `/api/admin/employees/${editingItem.id}` : "/api/admin/create-employee";
      else if (activeTab === "teams") endpoint = editingItem ? `/api/admin/teams/${editingItem.id}` : "/api/admin/teams";
      else if (activeTab === "birthdays") endpoint = editingItem ? `/api/admin/birthdays/${editingItem.id}` : "/api/admin/birthdays";
      else if (activeTab === "dates") endpoint = editingItem ? `/api/admin/company-dates/${editingItem.id}` : "/api/admin/company-dates";
      else endpoint = editingItem ? `/api/admin/bulletins/${editingItem.id}` : "/api/admin/bulletins";

      console.log(`Submitting ${method} request to: ${endpoint}`);
      console.log("Payload:", data);

      await api(endpoint, {
        method,
        body: JSON.stringify(data),
      });

      toast.success(editingItem ? "Atualizado com sucesso!" : "Cadastro realizado com sucesso!");
      form.reset();
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: Tab, id: number) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      let endpoint = `/api/admin/${type}/${id}`;
      if (type === "dates") endpoint = `/api/admin/company-dates/${id}`;
      
      await api(endpoint, { method: "DELETE" });
      toast.success("Registro excluído");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    // Note: React inputs will need defaultValues or values linked to editingItem
    // To keep it simple and reactive, we'll use formRef to set values manually if needed
    // but better to just use editingItem and key the form
  };

  const cancelEdit = () => {
    setEditingItem(null);
    formRef.current?.reset();
  };

  const handleExportEmployeePDF = async (type: 'daily' | 'monthly') => {
    if (!selectedEmployeeForReport) return;
    
    try {
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const year = new Date().getFullYear();
      const today = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

      const [stats, logs] = await Promise.all([
        api(`/api/time-logs/stats?month=${month}&year=${year}&userId=${selectedEmployeeForReport.id}`),
        api(`/api/time-logs?date=${today}&userId=${selectedEmployeeForReport.id}`) // Assuming API supports userId for admin
      ]);

      await exportEmployeePDF(type, selectedEmployeeForReport, logs || [], stats || [], new Date());
      toast.success(`Relatório de ${selectedEmployeeForReport.name} gerado!`);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  const handleUpdateAbsenceStatus = async (id: number, status: string) => {
    try {
      await api(`/api/admin/absences/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      toast.success(`Justificativa ${status === 'Aprovado' ? 'aprovada' : 'negada'}!`);
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (!user || user.role !== "admin") {

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Painel Administrativo</h1>
        </div>
        <p className="text-muted-foreground ml-11">Gestão de Equipes, Funcionários e Datas</p>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-card/50 backdrop-blur-md border border-border rounded-2xl w-fit shadow-sm">
        {[
          { id: "employees", label: "Funcionários", icon: Users },
          { id: "teams", label: "Equipes", icon: LayoutGrid },
          { id: "birthdays", label: "Aniversariantes", icon: Cake },
          { id: "dates", label: "Datas Comemorativas", icon: Calendar },
          { id: "bulletins", label: "Mural ANTEFFA", icon: Megaphone },
          { id: "management", label: "Gestão", icon: PieChart }
        ].map((tab) => {
          const isManagementTab = tab.id === "management";
          const hasAccess = user?.role === "admin" || user?.team_name === "Financeiro" || user?.team_name === "Presidência";
          
          return (
            <button
              key={tab.id}
              onClick={() => { 
                if (isManagementTab && !hasAccess) {
                  toast.error("Acesso Restrito", {
                    description: "Esta área é exclusiva para Admin, Financeiro e Presidência.",
                    icon: <AlertCircle className="w-5 h-5 text-destructive" />
                  });
                  return;
                }
                setActiveTab(tab.id as Tab); 
                setEditingItem(null); 
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                : isManagementTab && !hasAccess
                  ? "text-muted-foreground/30 cursor-not-allowed opacity-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {!hasAccess && isManagementTab && <Shield className="w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        {activeTab !== "management" && (
        <motion.div key={activeTab + (editingItem ? "-edit" : "-new")} {...fadeIn} className="lg:col-span-4">
          <div className="glass-card rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-8 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 transition-colors ${editingItem ? "bg-accent/10" : "bg-primary/5"}`} />

            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center gap-2">
                {editingItem ? <Edit3 className="w-5 h-5 text-accent" /> : <PlusCircle className="w-5 h-5 text-primary" />}
                <h2 className="text-lg font-bold text-foreground">
                  {editingItem ? "Editar" : "Cadastrar"} {
                    activeTab === "employees" ? "Funcionário" : 
                    activeTab === "teams" ? "Equipe" : 
                    activeTab === "birthdays" ? "Aniversariante" : 
                    activeTab === "dates" ? "Data" : "Aviso"
                  }
                </h2>
              </div>
              {editingItem && (
                <button onClick={cancelEdit} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 relative">
              {activeTab === "employees" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nome Completo</label>
                    <input name="name" required className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.name || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Usuário / Login</label>
                    <input name="username" required className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.username || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                    <input name="email" required type="email" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.email || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Equipe</label>
                    <div className="relative">
                      <select
                        name="team_id"
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground"
                        defaultValue={editingItem?.team_id || ""}
                      >
                        <option value="" className="bg-card text-foreground">Sem Equipe</option>
                        {teams.map(t => <option key={t.id} value={t.id} className="bg-card text-foreground">{t.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  {!editingItem && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Senha Inicial</label>
                      <input name="password" required type="password" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" placeholder="••••••••" />
                    </div>
                  )}
                </>
              )}

              {activeTab === "teams" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nome da Equipe</label>
                    <input name="name" required className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.name || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Descrição</label>
                    <input name="description" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.description || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Cor de Identificação</label>
                    <input name="color" type="color" className="w-full h-10 p-1 rounded-lg bg-card border border-border cursor-pointer" defaultValue={editingItem?.color || "#3b82f6"} />
                  </div>
                </>
              )}

              {activeTab === "birthdays" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Vincular Funcionário Cadastrado</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground font-medium"
                        onChange={(e) => {
                          const empId = e.target.value;
                          if (!empId) return;
                          const emp = employees.find(ev => ev.id.toString() === empId);
                          if (emp && formRef.current) {
                            // Find specific inputs within the form to ensure we target the current active tab's inputs
                            const nameInput = formRef.current.elements.namedItem('name') as HTMLInputElement;
                            const deptInput = formRef.current.elements.namedItem('department') as HTMLInputElement;

                            if (nameInput) {
                              nameInput.value = emp.name;
                              // Force a visual update by triggering a phantom input event if needed, 
                              // but name attribute should work for standard form submission
                            }
                            if (deptInput) {
                              deptInput.value = emp.team_name || "Geral";
                            }
                            toast.info(`Dados de ${emp.name} carregados`);
                          }
                        }}
                      >
                        <option value="" className="bg-card text-foreground">-- Selecionar da Lista de Funcionários --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id} className="bg-card text-foreground">
                            {emp.name} ({emp.team_name || "Sem Equipe"})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nome Completo</label>
                    <input name="name" required placeholder="Nome do aniversariante" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.name || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Data de Nascimento</label>
                    <input name="birth_date" required type="date" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground color-scheme-dark" defaultValue={editingItem?.birth_date || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Setor / Departamento (Equipe)</label>
                    <input name="department" placeholder="Setor ou Unidade" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.department || ""} />
                  </div>
                </>
              )}

              {activeTab === "dates" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Título do Evento</label>
                    <input name="title" required className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.title || ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Data</label>
                      <input name="event_date" required type="date" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground color-scheme-dark" defaultValue={editingItem?.event_date || ""} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Tipo / Classificação</label>
                      <div className="relative">
                        <select name="date_type" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground" defaultValue={editingItem?.date_type || "comemorativa"}>
                          <option value="feriado">🟢 Feriado</option>
                          <option value="facultativo">🟡 Ponto Facultativo</option>
                          <option value="comemorativa">⚪ Data Comemorativa</option>
                          <option value="lua">🟣 Fases da Lua</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Descrição</label>
                    <textarea name="description" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground min-h-[80px]" defaultValue={editingItem?.description || ""} />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <input 
                      type="checkbox" 
                      name="is_recurring" 
                      id="is_recurring"
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 bg-card cursor-pointer"
                      defaultChecked={editingItem?.is_recurring || false}
                    />
                    <label htmlFor="is_recurring" className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" /> Data Recorrente (Todo Ano)
                    </label>
                  </div>
                </>
              )}

              {activeTab === "bulletins" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Título do Aviso</label>
                    <input name="title" required placeholder="Ex: Assembleia Geral" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" defaultValue={editingItem?.title || ""} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Categoria</label>
                    <div className="relative">
                      <select name="category" className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-foreground" defaultValue={editingItem?.category || "noticia"}>
                        <option value="noticia">📢 Notícias (Assembleias, editais)</option>
                        <option value="beneficio">⭐ Benefícios (Convênios, parcerias)</option>
                        <option value="aviso">ℹ️ Avisos (Manutenções, RH)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Conteúdo do Aviso</label>
                    <textarea name="content" required placeholder="Descreva os detalhes do comunicado aqui..." className="w-full px-4 py-2.5 rounded-lg bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground min-h-[120px]" defaultValue={editingItem?.content || ""} />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 mt-4 text-primary-foreground rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 ${editingItem ? "bg-accent shadow-accent/30 hover:shadow-accent/40" : "bg-primary shadow-primary/30 hover:shadow-primary/40"} hover:-translate-y-0.5 active:translate-y-0`}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingItem ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />}
                {editingItem ? "Salvar Alterações" : "Gravar Registro"}
              </button>
            </form>
          </div>
        </motion.div>
        )}

        {/* List Column */}
        <motion.div key={activeTab + "-list"} {...fadeIn} className={activeTab === "management" ? "col-span-full lg:col-span-12 space-y-4" : "lg:col-span-8 space-y-4"}>
          {activeTab !== "management" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              {activeTab === "employees" ? <Users className="w-5 h-5 text-primary" /> : 
               activeTab === "teams" ? <LayoutGrid className="w-5 h-5 text-primary" /> : 
               activeTab === "birthdays" ? <Cake className="w-5 h-5 text-primary" /> : 
               activeTab === "dates" ? <Calendar className="w-5 h-5 text-primary" /> :
               <Megaphone className="w-5 h-5 text-primary" />}
              Lista de {
                activeTab === "employees" ? "Funcionários" : 
                activeTab === "teams" ? "Equipes" : 
                activeTab === "birthdays" ? "Aniversariantes" : 
                activeTab === "dates" ? "Datas" : "Avisos Mural"
              }
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="w-full pl-10 pr-4 py-2 rounded-2xl bg-card/50 border border-border text-xs outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === "management" ? (
              <div className="col-span-full space-y-8">
                {/* Stats Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Faltas no Mês", value: managementStats.total_absences, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
                    { label: "Atestados", value: managementStats.total_certificates, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Banco de Horas (-)", value: `${managementStats.total_negative_hours}h`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
                    { label: "Banco de Horas (+)", value: `${managementStats.total_positive_hours}h`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-6 rounded-3xl border border-border shadow-sm group hover:border-primary/30 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Employee Selector & Reports */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden bg-muted/20">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-2">
                       <h3 className="text-xl font-bold text-foreground">Relatórios de Ponto</h3>
                       <p className="text-sm text-muted-foreground italic">Selecione um funcionário para visualizar e exportar seu espelho de ponto.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                      <div className="relative min-w-[280px]">
                        <select 
                          className="w-full h-14 pl-12 pr-10 rounded-2xl bg-card border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold appearance-none cursor-pointer"
                          onChange={(e) => {
                            const emp = employees.find(ev => ev.id.toString() === e.target.value);
                            setSelectedEmployeeForReport(emp);
                          }}
                        >
                          <option value="">-- Selecionar Funcionário --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>

                      {selectedEmployeeForReport && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleExportEmployeePDF('daily')}
                            className="flex-1 h-14 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                          >
                             Relatório Diário <ChevronRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleExportEmployeePDF('monthly')}
                            className="flex-1 h-14 px-6 rounded-2xl bg-background border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-card transition-all"
                          >
                             Espelho Mensal <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Background Accents */}
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
                </div>

                {/* Pending Absences Review Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Justificativas Pendentes</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                      {absences.filter(a => a.status === 'Pendente').length} NOVAS
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {absences.filter(a => a.status === 'Pendente').length === 0 ? (
                      <div className="py-12 text-center glass-card border-dashed border-2 border-border/50 rounded-3xl">
                        <p className="text-muted-foreground text-xs italic">Nenhuma justificativa pendente no momento.</p>
                      </div>
                    ) : (
                      absences.filter(a => a.status === 'Pendente').map((abs) => (
                        <motion.div 
                          key={abs.id} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-6 rounded-3xl border border-border hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                              {abs.users?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                               <p className="text-sm font-black text-foreground">{abs.users?.name || "Usuário"}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-muted text-[9px] font-black text-muted-foreground uppercase">{abs.category}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold">{new Date(abs.absence_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
                               </div>
                               <p className="text-xs text-muted-foreground mt-2 italic">“{abs.reason}”</p>
                               {(() => {
                                  let meta = abs.metadata;
                                  if (typeof meta === 'string') {
                                     try { meta = JSON.parse(meta); } catch(e) {}
                                  }
                                  return meta && Object.keys(meta).length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {Object.entries(meta).map(([k, v]) => v ? (
                                        <span key={k} className="px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-[9px] font-bold text-primary italic lowercase">
                                          {k}: {v as React.ReactNode}
                                        </span>
                                      ) : null)}
                                    </div>
                                  ) : null;
                               })()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                             {abs.attachment_url && (
                                <a 
                                  href={`http://${window.location.hostname}:3001${abs.attachment_url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center hover:bg-card transition-all text-muted-foreground hover:text-primary mr-2"
                                  title="Ver Anexo"
                                >
                                  <FileText className="w-5 h-5" />
                                </a>
                             )}
                             <button 
                                onClick={() => handleUpdateAbsenceStatus(abs.id, 'Negado')}
                                className="h-12 px-6 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2"
                             >
                               <XCircle className="w-4 h-4" /> Negar
                             </button>
                             <button 
                                onClick={() => handleUpdateAbsenceStatus(abs.id, 'Aprovado')}
                                className="h-12 px-6 rounded-2xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                             >
                               <CheckCircle2 className="w-4 h-4" /> Aprovar
                             </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            ) : (() => {
              const list = activeTab === "employees" ? employees : activeTab === "teams" ? teams : activeTab === "birthdays" ? birthdays : activeTab === "dates" ? companyDates : bulletins;
              const filtered = list.filter(item => {
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
                        <img src={`http://${window.location.hostname}:3001${item.avatar_url}`} className="w-full h-full object-cover" />
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

