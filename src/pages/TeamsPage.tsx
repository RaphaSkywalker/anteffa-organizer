import { useState, useEffect } from "react";
import { Users, MoreHorizontal, LayoutGrid, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

export default function TeamsPage() {
  const { api } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, empsData] = await Promise.all([
          api("/api/teams"),
          api("/api/admin/employees").catch(() => []) // Fallback if not admin
        ]);
        setTeams(teamsData);
        setEmployees(empsData);
      } catch (error) {
        console.error("Erro ao carregar equipes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Grouping logic
  const teamsWithMembers = teams.map(team => ({
    ...team,
    members: employees.filter(emp => emp.team_name === team.name)
  }));

  const membersWithoutTeam = employees.filter(emp => !emp.team_name);

  return (
    <div className="space-y-8 pb-12">
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipes & Times</h1>
            <p className="text-sm text-muted-foreground italic">Visualização dos colaboradores agrupados por equipe</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse border border-border" />)}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Real Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {teamsWithMembers.map((team, idx) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card rounded-[1.5rem] border border-border overflow-hidden shadow-lg group hover:border-primary/40 transition-all"
                >
                  {/* Header with Color */}
                  <div className="h-2 w-full" style={{ backgroundColor: team.color || '#3b82f6' }} />

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{team.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{team.description || "Equipe corporativa"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Membros ({team.members.length})</span>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                        {team.members.length > 0 ? (
                          team.members.map((member: any) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                                {member.avatar_url ? (
                                  <img src={`http://${window.location.hostname}:3001${member.avatar_url}`} className="w-full h-full object-cover" />
                                ) : member.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{member.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{member.email}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] italic text-muted-foreground/60 py-2">Nenhum membro vinculado ainda</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Unassigned members */}
          {membersWithoutTeam.length > 0 && (
            <motion.div {...fadeIn} className="pt-6 border-t border-border">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> Colaboradores sem Equipe
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {membersWithoutTeam.map(member => (
                  <div key={member.id} className="glass-card rounded-2xl border border-border p-3 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                    <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white mb-2 shadow-md">
                      {member.avatar_url ? (
                        <img src={`http://${window.location.hostname}:3001${member.avatar_url}`} className="w-full h-full object-cover rounded-full" />
                      ) : member.name[0].toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-foreground truncate w-full">{member.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate w-full">{member.username}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {teams.length === 0 && !loading && (
            <div className="text-center py-20 glass-card rounded-[2rem] border border-dashed border-border/60">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Nenhuma equipe configurada</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                As equipes cadastradas no Painel Administrativo aparecerão aqui com seus respectivos membros.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
