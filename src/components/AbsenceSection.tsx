import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileUp, ShieldAlert, Loader2, Info, PlusCircle, CheckCircle2, Clock3, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  saude: { label: "🏥 Saúde", hasFile: true, fileOptional: false,
    fields: [
      { id: "cid", label: "CID (Opcional)", type: "text", placeholder: "Ex: J00" },
      { id: "crm", label: "CRM do Médico", type: "text", placeholder: "Opcional" }
    ],
    sub: ["Doença (com atestado)", "Consulta médica", "Exame médico", "Acompanhamento de familiar"]
  },
  familia: { label: "👨‍👩‍👧‍👦 Família / Pessoal", hasFile: true, fileOptional: true,
    fields: [
      { id: "parentesco", label: "Grau de Parentesco", type: "text", placeholder: "Ex: Pai, Mãe, Filho" }
    ],
    sub: ["Falecimento de familiar", "Nascimento de filho", "Problemas familiares urgentes", "Acompanhamento de dependente"]
  },
  ferias: { label: "🏖️ Férias e Folgas", hasFile: false, fileOptional: true,
    fields: [
      { id: "aprovacao", label: "Aprovação prévia do Gestor?", type: "select", options: ["Sim, já aprovado", "Ainda não"] }
    ],
    sub: ["Férias programadas", "Férias antecipadas", "Banco de horas (folga)", "Compensação de horas"]
  },
  trabalho: { label: "🏢 Trabalho / Empresa", hasFile: true, fileOptional: true,
    fields: [
      { id: "local", label: "Local da Atividade", type: "text", placeholder: "Nome da instituição/cliente" }
    ],
    sub: ["Viagem a trabalho", "Treinamento", "Evento corporativo", "Trabalho externo"]
  },
  logistica: { label: "🚗 Transporte / Logística", hasFile: true, fileOptional: true,
    fields: [
      { id: "descricao", label: "Descrição detalhada", type: "textarea", placeholder: "O que ocorreu?" }
    ],
    sub: ["Problemas com transporte público", "Acidente de trânsito", "Veículo com defeito"]
  },
  legal: { label: "⚖️ Legal / Obrigatório", hasFile: true, fileOptional: false,
    fields: [
      { id: "processo", label: "Número do Processo (Se houver)", type: "text", placeholder: "Ex: 0000000-00.0000..." }
    ],
    sub: ["Comparecimento judicial", "Serviço militar", "Obrigações legais"]
  },
  educacao: { label: "📚 Educação", hasFile: true, fileOptional: true,
    fields: [
      { id: "instituicao", label: "Nome da Instituição", type: "text" }
    ],
    sub: ["Prova / faculdade", "Curso / certificação"]
  },
  sem_justificativa: { label: "❌ Sem Justificativa", hasFile: false, fileOptional: true,
    fields: [
      { id: "obs", label: "Observações", type: "textarea", placeholder: "Gostaria de registrar algo?"}
    ],
    sub: ["Falta injustificada"]
  }
};

export default function AbsenceSection() {
  const { api } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [openForm, setOpenForm] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>({});

  const fetchHistory = async () => {
    try {
      const data = await api('/api/absences/my');
      setHistory(data || []);
    } catch (e) {
       console.error("Erro ao buscar histórico");
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!category || !reason || !startDate) return toast.error("Preencha os campos essenciais.");
     
     const config = CATEGORIES[category as keyof typeof CATEGORIES];
     if (config.hasFile && !config.fileOptional && !file) {
        return toast.error("Upload de documento obrigatório para esta categoria.");
     }

     if (category === "ferias" && metadata.aprovacao === "Ainda não") {
       const proceed = window.confirm("Atenção: Folgas e Férias sem aprovação prévia poderão ser classificadas como Faltas Injustificadas. Deseja enviar o pedido para o fluxo do Gestor mesmo assim?");
       if (!proceed) return;
     }

     setSubmitting(true);
     try {
        let attachment_url = null;
        if (file) {
           const formData = new FormData();
           formData.append('file', file);
           const resUpload = await api('/api/upload-document', {
             method: 'POST',
             body: formData
           });
           attachment_url = resUpload.url;
        }

        await api('/api/absences', {
           method: 'POST',
           body: JSON.stringify({
              category,
              reason,
              absence_date: startDate,
              end_date: endDate || null,
              attachment_url,
              metadata
           })
        });

        toast.success("Justificativa registrada com sucesso!");
        setOpenForm(false);
        setCategory("");
        setReason("");
        setStartDate("");
        setEndDate("");
        setFile(null);
        setMetadata({});
        fetchHistory();
     } catch (e) {
        toast.error("Erro ao registrar justificativa");
     } finally {
        setSubmitting(false);
     }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!confirm("Deseja realmente excluir este registro negado?")) return;
    try {
       await api(`/api/absences/${id}`, { method: 'DELETE' });
       toast.success("Registro excluído!");
       fetchHistory();
    } catch (e) {
       toast.error("Erro ao excluir registro");
    }
  };

  const getStatusColor = (status: string) => {

    if (status === "Aprovado") return "text-green-500 bg-green-500/10 border-green-500/20";
    if (status === "Negado") return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Aprovado") return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (status === "Negado") return <XCircle className="w-3.5 h-3.5" />;
    return <Clock3 className="w-3.5 h-3.5" />;
  };

  return (
    <div className="glass-card p-8 rounded-[2rem] border border-border/50 bg-background/50 shadow-xl overflow-hidden mt-8 w-full">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-xl font-black text-foreground flex items-center gap-2">
           <ShieldAlert className="w-6 h-6 text-primary" /> Faltas N° Mês e Afastamentos
         </h3>
         {!openForm && (
           <button onClick={() => setOpenForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
             <PlusCircle className="w-4 h-4" /> Nova Justificativa
           </button>
         )}
      </div>

      {openForm && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 rounded-3xl bg-card border border-border space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground">Formulário de Justificativa</h4>
              <button type="button" onClick={() => setOpenForm(false)} className="text-muted-foreground hover:text-foreground p-2"><XCircle className="w-5 h-5" /></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-primary uppercase tracking-widest">1. Qual o motivo?</label>
                 <select required value={category} onChange={(e) => { setCategory(e.target.value); setReason(""); setMetadata({}); }} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium text-foreground cursor-pointer appearance-none">
                    <option value="">-- Selecione uma categoria --</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                       <option key={k} value={k}>{v.label}</option>
                    ))}
                 </select>
              </div>

              {category && (
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-primary uppercase tracking-widest">2. Especifique</label>
                   <select required value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium text-foreground cursor-pointer appearance-none">
                      <option value="">-- Selecione o detalhe --</option>
                      {CATEGORIES[category as keyof typeof CATEGORIES].sub.map((sub) => (
                         <option key={sub} value={sub}>{sub}</option>
                      ))}
                   </select>
                </div>
              )}
           </div>

           {category && reason && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-500 p-6 rounded-2xl bg-muted/20 border border-border space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-foreground">Data Inicial</label>
                    <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 text-sm text-foreground color-scheme-dark" />
                 </div>
                 {(category === "ferias" || category === "saude") && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-foreground flex items-center gap-1">Data Final <span className="opacity-50">(opcional)</span></label>
                       <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 text-sm text-foreground color-scheme-dark" />
                    </div>
                 )}
               </div>

               {CATEGORIES[category as keyof typeof CATEGORIES].fields.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                    {CATEGORIES[category as keyof typeof CATEGORIES].fields.map(field => (
                       <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-foreground">{field.label}</label>
                          {field.type === "select" ? (
                             <select value={metadata[field.id] || ""} onChange={e => setMetadata({...metadata, [field.id]: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 text-sm text-foreground">
                                <option value="">- Selecione -</option>
                                {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          ) : field.type === "textarea" ? (
                             <textarea rows={3} value={metadata[field.id] || ""} onChange={e => setMetadata({...metadata, [field.id]: e.target.value})} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 text-sm text-foreground" />
                          ) : (
                             <input type="text" value={metadata[field.id] || ""} onChange={e => setMetadata({...metadata, [field.id]: e.target.value})} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 text-sm text-foreground" />
                          )}
                       </div>
                    ))}
                 </div>
               )}

               {CATEGORIES[category as keyof typeof CATEGORIES].hasFile && (
                 <div className="pt-4 border-t border-border/50">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block text-foreground">
                      Anexo / Documento Comprobatório {!CATEGORIES[category as keyof typeof CATEGORIES].fileOptional && <span className="text-red-500">* (Obrigatório)</span>}
                    </label>
                    <div className="relative w-full">
                       <input 
                         type="file" 
                         accept=".pdf,.png,.jpg,.jpeg"
                         onChange={(e) => setFile(e.target.files?.[0] || null)}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                       />
                       <div className={cn("w-full px-6 py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all", file ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted/50")}>
                          <FileUp className="w-8 h-8" />
                          <p className="font-bold text-sm">{file ? file.name : "Clique para anexar ou arraste o arquivo"}</p>
                          <p className="text-[10px] uppercase tracking-widest">PDF, PNG ou JPG até 5MB</p>
                       </div>
                    </div>
                 </div>
               )}

               <div className="pt-6 flex justify-end">
                 <button type="submit" disabled={submitting} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Justificativa"}
                 </button>
               </div>
             </div>
           )}
        </form>
      )}

      {/* Histórico */}
      <div>
         <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Meus Registros</h4>
         {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground opacity-30" /></div>
         ) : history.length === 0 ? (
            <div className="py-12 bg-card rounded-3xl border border-border flex flex-col items-center gap-3 text-muted-foreground">
               <Info className="w-8 h-8 opacity-20" />
               <p className="text-sm font-bold">Nenhuma justificativa registrada no momento.</p>
            </div>
         ) : (
            <div className="grid gap-3">
               {history.map((h, i) => (
                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1", getStatusColor(h.status || "Pendente"))}>
                             {getStatusIcon(h.status || "Pendente")} {h.status || "Pendente"}
                          </span>
                          <span className="text-xs font-black text-foreground">{h.absence_date ? new Date(h.absence_date).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : ""}</span>
                       </div>
                       <p className="text-sm font-bold text-foreground">
                          {CATEGORIES[h.category as keyof typeof CATEGORIES]?.label.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s/]/g, '').trim() || h.category} - {h.reason}
                       </p>
                       {(() => {
                          let meta = h.metadata;
                          if (typeof meta === 'string') {
                             try { meta = JSON.parse(meta); } catch(e) {}
                          }
                          return meta && Object.keys(meta).length > 0 ? (
                             <div className="flex flex-wrap gap-2 mt-2">
                               {Object.entries(meta).map(([k, v]) => v ? (
                                  <span key={k} className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                     {k}: <span className="text-foreground">{v as React.ReactNode}</span>
                                  </span>
                               ) : null)}
                             </div>
                          ) : null;
                       })()}
                    </div>
                    <div className="flex items-center gap-2">
                       {h.status === 'Negado' && (
                          <button 
                            onClick={() => handleDeleteAbsence(h.id)}
                            className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all mr-1"
                            title="Excluir Registro Negado"
                          >
                             <Trash2 className="w-5 h-5" />
                          </button>
                       )}
                       {h.attachment_url && (
                          <a href={`${API_URL}${h.attachment_url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                             <FileUp className="w-5 h-5" />
                          </a>
                       )}
                    </div>
                 </div>

               ))}
            </div>
         )}
      </div>
    </div>
  );
}
