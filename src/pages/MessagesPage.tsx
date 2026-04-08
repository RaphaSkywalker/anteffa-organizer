import { useI18n } from "@/contexts/I18nContext";
import { Mail, Archive, Send as SendIcon, Plus, X, Search, CheckCircle2, User, Loader2, Reply, Trash2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, safeDate } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

type Tab = "inbox" | "sent" | "archived";

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  content: string;
  is_read: number;
  created_at: string;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
}

interface Employee {
  id: number;
  name: string;
  username: string;
  avatar_url?: string;
}

export default function MessagesPage() {
  const { t } = useI18n();
  const { api, user } = useAuth();
  const [tab, setTab] = useState<Tab>("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Compose form states
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api(`/api/mail?tab=${tab}`);
      setMessages(prev => {
        // Only update state if data changed to avoid unnecessary re-renders
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
    } catch (error) {
      console.error("Error fetching mail:", error);
      if (!silent) toast.error("Erro ao carregar mensagens");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api("/api/employees");
      setEmployees(data.filter((e: any) => e.id !== user?.id));
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [tab]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [tab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject || !content) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSending(true);
    try {
      await api("/api/mail", {
        method: "POST",
        body: JSON.stringify({
          recipient_id: parseInt(recipientId),
          subject,
          content
        })
      });
      toast.success("Mensagem enviada com sucesso!");
      setShowCompose(false);
      setRecipientId("");
      setSubject("");
      setContent("");
      if (tab === "sent") fetchMessages();
    } catch (error) {
      console.error("Error sending mail:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api(`/api/mail/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "archive" })
      });
      toast.success("Mensagem arquivada");
      fetchMessages();
    } catch (error) {
      toast.error("Erro ao arquivar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta mensagem da sua caixa?")) return;
    try {
      await api(`/api/mail/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "delete" })
      });
      toast.success("Mensagem excluída");
      fetchMessages();
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api(`/api/mail/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "read" })
      });
      fetchMessages();
    } catch (error) { }
  };

  const handleReply = (msg: Message) => {
    setRecipientId(String(msg.sender_id));
    setSubject(`Re: ${msg.subject}`);
    setContent(`\n\n--- Em ${new Date(msg.created_at).toLocaleString('pt-BR')} ---\n${msg.content}`);
    setShowCompose(true);
    setSelectedMessage(null);
  };

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "inbox", label: t("messages.inbox"), icon: Mail, count: messages.filter(m => !m.is_read && tab === 'inbox').length || undefined },
    { key: "sent", label: t("messages.sent"), icon: SendIcon },
    { key: "archived", label: t("messages.archived"), icon: Archive },
  ];

  return (
    <div className="space-y-6 pb-20">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-black uppercase tracking-tight">Sistema de Mensagens Internas</h1>
        <button
          onClick={() => {
            setRecipientId("");
            setSubject("");
            setContent("");
            setShowCompose(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl gradient-brand text-primary-foreground text-sm font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> {t("messages.compose")}
        </button>
      </motion.div>

      <motion.div {...fadeIn}>
        <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl w-fit mb-6 border border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelectedMessage(null);
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-tighter rounded-xl transition-all",
                tab === t.key
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count && (
                <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-black animate-pulse">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-[2rem] border border-border overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin opacity-20" />
              <p className="text-sm font-medium italic">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
              <Mail className="w-12 h-12 opacity-10" />
              <p className="text-sm font-medium italic">Nenhuma mensagem nesta pasta.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (tab === 'inbox' && !msg.is_read) handleMarkAsRead(msg.id);
                  }}
                  className={cn(
                    "flex items-center gap-4 px-6 py-5 hover:bg-muted/30 transition-all cursor-pointer group relative",
                    tab === 'inbox' && !msg.is_read && "bg-primary/[0.03]"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-black shrink-0 overflow-hidden shadow-sm">
                    {tab === 'sent' ? (
                      msg.to_avatar ? <img src={`http://${window.location.hostname}:3001${msg.to_avatar}`} className="w-full h-full object-cover" /> : msg.to_name?.[0]
                    ) : (
                      msg.from_avatar ? <img src={`http://${window.location.hostname}:3001${msg.from_avatar}`} className="w-full h-full object-cover" /> : msg.from_name?.[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cn("text-xs font-black uppercase tracking-tight", tab === 'inbox' && !msg.is_read ? "text-primary" : "text-muted-foreground text-[10px]")}>
                        {tab === 'sent' ? `Para: ${msg.to_name}` : `De: ${msg.from_name}`}
                      </p>
                      {tab === 'inbox' && !msg.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <h3 className={cn("text-sm truncate leading-tight", tab === 'inbox' && !msg.is_read ? "font-bold text-foreground" : "font-medium text-foreground")}>
                      {msg.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate opacity-70 mt-0.5">{msg.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                      {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tab === 'inbox' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Responder"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      )}
                      {tab !== 'archived' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(msg.id); }}
                          className="p-2 rounded-lg hover:bg-warning/10 text-warning transition-colors"
                          title="Arquivar"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* View Message Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground mr-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-black shrink-0 overflow-hidden shadow-md">
                    {tab === 'sent' ? (
                      selectedMessage.to_avatar ? <img src={`http://${window.location.hostname}:3001${selectedMessage.to_avatar}`} className="w-full h-full object-cover" /> : selectedMessage.to_name?.[0]
                    ) : (
                      selectedMessage.from_avatar ? <img src={`http://${window.location.hostname}:3001${selectedMessage.from_avatar}`} className="w-full h-full object-cover" /> : selectedMessage.from_name?.[0]
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground uppercase tracking-tight line-clamp-1">{selectedMessage.subject}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                      {tab === 'sent' ? `Para: ${selectedMessage.to_name}` : `De: ${selectedMessage.from_name}`} • {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tab === 'inbox' && (
                    <button onClick={() => handleReply(selectedMessage)} className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" title="Responder">
                      <Reply className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(selectedMessage.id)} className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm" title="Excluir">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-card/30">
                <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>

              <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">
                  ID: #{selectedMessage.id} • Anteffa Communications
                </span>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-8 py-3 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompose(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSend}>
                <div className="p-8 border-b border-border flex items-center justify-between bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Nova Mensagem Interna</h2>
                      <p className="text-xs text-muted-foreground font-medium">Comunique-se de forma direta com a equipe</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="p-3 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Para:</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <select
                        required
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-muted/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none"
                      >
                        <option value="">Selecione um funcionário...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name || emp.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Assunto:</label>
                    <input
                      required
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Sobre o que é esta mensagem?"
                      className="w-full px-6 py-4 rounded-2xl bg-muted/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Mensagem:</label>
                    <textarea
                      required
                      rows={6}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escreva sua mensagem aqui..."
                      className="w-full px-6 py-4 rounded-2xl bg-muted/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium resize-none custom-scrollbar"
                    />
                  </div>
                </div>

                <div className="p-8 bg-muted/30 border-t border-border flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-10 py-4 rounded-2xl gradient-brand text-primary-foreground text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                    {sending ? "Enviando..." : "Enviar agora"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
