import { useI18n } from "@/contexts/I18nContext";
import { Send, Search, Circle, Pencil, Trash2, Hash, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

interface Message {
  id: string;
  senderId: number;
  senderName: string;
  text: string;
  time: string;
  isDeleted?: boolean;
  isEdited?: boolean;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  team_id?: number | null;
  team_name?: string | null;
  unread_count?: number;
}

const statusColors: Record<string, string> = {
  online: "bg-success",
  offline: "bg-muted-foreground/40",
  away: "bg-warning",
};

export default function ChatPage() {
  const { t } = useI18n();
  const { user, api } = useAuth();
  const [activeChat, setActiveChat] = useState<{ id: string | number; name: string; type: "global" | "team" | "direct"; avatar_url?: string }>({
    id: "geral",
    name: "Geral",
    type: "global",
  });
  const [contacts, setContacts] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const data = await api("/api/profile");
      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Unread counts are now handled via the employee list fetch

  const fetchEmployees = async () => {
    try {
      if (!isLoading) setIsLoading(true);
      // Add timestamp to avoid browser cache
      const data = await api(`/api/employees?t=${Date.now()}`);

      if (Array.isArray(data)) {
        const myId = user?.id ? String(user.id) : null;
        const filtered = data.filter((e: any) => String(e.id) !== myId);
        setContacts(filtered);
        setError(null);
      } else {
        setError("O servidor não retornou uma lista válida.");
      }
    } catch (err: any) {
      console.error("Chat fetch error:", err);
      setError(err.message || "Erro de conexão com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({
        target_type: activeChat.type,
        target_id: activeChat.type === 'global' ? '0' : activeChat.id.toString()
      });
      const data = await api(`/api/messages?${params.toString()}`);
      setMessages(data.map((m: any) => {
        let timeStr = "--:--";
        try {
          if (m.created_at) {
            const date = new Date(m.created_at.replace(/-/g, '/'));
            if (!isNaN(date.getTime())) {
              timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            }
          }
        } catch (e) { }

        return {
          id: m.id.toString(),
          senderId: m.sender_id,
          senderName: m.sender_name,
          text: m.content || "",
          time: timeStr,
          isDeleted: !!m.is_deleted,
          isEdited: !!m.is_edited
        };
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchEmployees();
  }, [user?.id]);



  useEffect(() => {
    if (activeChat) {
      setMessages([]);
      fetchMessages();
      fetchEmployees();

      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(() => {
        fetchMessages();
        fetchEmployees();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChat, user?.id]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await api("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          target_type: activeChat.type,
          target_id: activeChat.type === 'global' ? null : String(activeChat.id),
          content: inputValue
        })
      });
      setInputValue("");
      fetchMessages();
      toast.success("Mensagem enviada");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm(`Deseja realmente limpar apenas o SEU histórico de mensagens no chat ${activeChat.name}?`)) return;
    try {
      const params = new URLSearchParams({
        target_type: activeChat.type,
        target_id: activeChat.type === 'global' ? '0' : activeChat.id.toString()
      });
      await api(`/api/messages/clear?${params.toString()}`, {
        method: "DELETE"
      });
      fetchMessages(); // Refresh to see only the other person's messages (or none)
      toast.success("Seu histórico foi limpo");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Deseja realmente excluir esta mensagem?")) return;
    try {
      await api(`/api/messages/${msgId}`, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' }
      });
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Erro ao excluir mensagem.");
    }
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditValue(msg.text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await api(`/api/messages/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ content: editValue })
      });
      setEditingId(null);
      fetchMessages();
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const teamName = currentUser?.team_name;
  const teamId = currentUser?.team_id;

  return (
    <div className="h-[calc(100vh-12rem)]">
      <motion.div {...fadeIn} className="flex gap-0 h-[calc(100vh-8.5rem)] rounded-[2rem] border border-border overflow-hidden glass-card shadow-2xl">
        {/* Sidebar */}
        <div className="w-72 border-r border-border flex flex-col shrink-0 bg-muted/10">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground mb-4">Conversas</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card/50 text-xs border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                placeholder="Pesquisar..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
            {/* Canais */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Canais</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveChat({ id: "geral", name: "Geral", type: "global" })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                    activeChat.id === "geral" && activeChat.type === "global" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Hash className={cn("w-4 h-4", activeChat.id === "geral" ? "text-primary-foreground" : "text-primary")} />
                  <span className="font-bold">Geral</span>
                </button>

                {teamId && (
                  <button
                    onClick={() => setActiveChat({ id: teamId, name: teamName || "Minha Equipe", type: "team" })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                      activeChat.type === "team" ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Users className={cn("w-4 h-4", activeChat.type === "team" ? "text-accent-foreground" : "text-accent")} />
                    <span className="font-bold">{teamName || "Equipe"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Contatos */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Equipe Anteffa {contacts.length > 0 && `(${contacts.length})`}
              </p>
              {/* Debug info - only visible if 0 contacts */}
              {contacts.length === 0 && !isLoading && !error && (
                <p className="px-3 mb-2 text-[8px] text-muted-foreground opacity-50 uppercase font-bold">
                  Verificando banco de dados...
                </p>
              )}
              <div className="space-y-1">
                {isLoading && contacts.length === 0 ? (
                  <p className="px-3 text-[10px] text-muted-foreground animate-pulse">Carregando contatos...</p>
                ) : error ? (
                  <p className="px-3 text-[10px] text-destructive italic">{error}</p>
                ) : contacts.length > 0 ? (
                  contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChat({ id: c.id, name: c.name || c.username, type: "direct", avatar_url: c.avatar_url })}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative",
                        String(activeChat.id) === String(c.id) && activeChat.type === 'direct' ? "bg-muted text-foreground border border-border shadow-sm" : "text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 overflow-hidden">
                          {c.avatar_url ? (
                            <img src={`http://${window.location.hostname}:3001${c.avatar_url}`} className="w-full h-full object-cover" />
                          ) : (
                            (c.name || c.username || "?").split(" ").map(w => w[0]).join("")
                          )}
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-card bg-success" />
                      </div>
                      <div className="flex flex-col items-start min-w-0 flex-1 pr-6">
                        <span className="font-bold truncate w-full tracking-tight text-left">{c.name || c.username}</span>
                        <span className="text-[9px] opacity-60 uppercase font-black tracking-tighter text-left">{c.team_name || "Geral"}</span>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {c.unread_count !== undefined && c.unread_count > 0 && String(activeChat.id) !== String(c.id) && (
                          <div
                            className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center animate-bounce shadow-lg shadow-red-600/40 z-20"
                            style={{ backgroundColor: '#dc2626' }}
                          >
                            <span className="text-[10px] font-black text-white">{c.unread_count}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-3 text-[10px] text-muted-foreground italic">Nenhum funcionário cadastrado</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/40">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2.5 rounded-xl",
                activeChat.type === "global" ? "bg-primary/10" : activeChat.type === "team" ? "bg-accent/10" : "bg-muted"
              )}>
                {activeChat.type === "global" ? (
                  <Hash className="w-5 h-5 text-primary" />
                ) : activeChat.type === "team" ? (
                  <Users className="w-5 h-5 text-accent" />
                ) : (
                  <div className="w-9 h-9 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-bold shrink-0 overflow-hidden shadow-sm">
                    {activeChat.avatar_url ? (
                      <img src={`http://${window.location.hostname}:3001${activeChat.avatar_url}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] font-black uppercase">
                        {(activeChat.name || "?").split(" ").map(w => w[0]).join("")}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">{activeChat.name}</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-bold">Ativo agora</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group flex items-center gap-2"
              title="Limpar Chat"
            >
              <span className="text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Limpar Chat</span>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-chat-pattern">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <Send className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold italic">Diga olá em #{activeChat.name}!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = String(msg.senderId) === String(user?.id);
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[80%] group", isMine ? "ml-auto items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isMine && <span className="text-[10px] font-black text-primary uppercase">{msg.senderName}</span>}
                      <span className="text-[9px] text-muted-foreground font-medium">{msg.time}</span>
                    </div>

                    <div className="relative group">
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-sm shadow-sm transition-all",
                        isMine
                          ? "gradient-brand text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border text-foreground rounded-tl-none",
                        msg.isDeleted && "italic opacity-60 bg-muted text-muted-foreground border-dashed"
                      )}>
                        {editingId === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-background/20 border-none focus:ring-0 text-inherit resize-none p-0 text-sm"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3" /></button>
                              <button onClick={handleSaveEdit} className="p-1 hover:bg-white/10 rounded"><Send className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.text}
                            {msg.isEdited && !msg.isDeleted && <span className="ml-2 text-[8px] opacity-50">(editado)</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-card/30 backdrop-blur-sm border-t border-border">
            <form onSubmit={handleSendMessage} className="flex gap-3 relative">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-6 py-4 rounded-2xl bg-background/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                placeholder={activeChat.type !== 'direct' ? `Mensagem em #${activeChat.name}...` : `Mensagem privada para ${activeChat.name}...`}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-4 rounded-2xl gradient-brand text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div >
      </motion.div >
    </div >
  );
}
