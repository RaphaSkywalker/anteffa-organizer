import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BackgroundWaves = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full opacity-60"
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static Surface Background (Stopped) */}
        <path
          d="M0 400C240 320 480 480 720 400C960 320 1200 480 1440 400V800H0V400Z"
          className="fill-primary/5"
        />
        
        {/* Forward Wavy Lines (10 lines) - Enhanced visibility and white-ish color */}
        {[...Array(10)].map((_, i) => (
          <motion.path
            key={`fwd-${i}`}
            d="M-200 300C100 200 400 400 700 300C1000 200 1300 400 1600 300C1900 200 2200 400 2500 300"
            stroke="white"
            strokeWidth="1.2"
            className="opacity-20"
            style={{ y: i * 15 }}
            animate={{
              x: [-200, 200],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 12 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}

        {/* Reverse Wavy Lines (10 lines) - Crossing - Enhanced visibility and white-ish color */}
        {[...Array(10)].map((_, i) => (
          <motion.path
            key={`rev-${i}`}
            d="M2500 500C2200 600 1900 400 1600 500C1300 600 1000 400 700 500C400 600 100 400 -200 500"
            stroke="white"
            strokeWidth="1"
            className="opacity-15"
            style={{ y: -i * 12 }}
            animate={{
              x: [100, -100],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 14 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                toast.success("Bem-vindo de volta! 👋");
                navigate("/");
            } else {
                toast.error("Acesso negado. Verifique suas credenciais.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans select-none">
            {/* Wavy Background Component */}
            <BackgroundWaves />

            {/* Subtle Gradient Orbs for Depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[180px] rounded-full pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[460px] p-10 bg-card border border-border/80 rounded-[1.5rem] shadow-2xl z-10 mx-4 relative overflow-hidden"
            >
                {/* Branding Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 mb-6 group cursor-default">
                        <img src="/logo-anteffa.png" alt="Anteffa Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h1 className="font-black text-foreground text-3xl tracking-tighter leading-tight">
                        ANTEFFA
                    </h1>
                    <div className="flex flex-col items-center -mt-1">
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-80 leading-none">
                            Administrativo
                        </p>
                        <p className="text-[9px] text-primary font-bold tracking-widest uppercase mt-2 opacity-50">
                            V2.0 ABR 2026
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Usuário do Sistema
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/40 border border-border/50 focus:bg-background focus:border-primary focus:ring-8 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium shadow-sm"
                                placeholder="ex: administrador"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                               Senha Autorizada
                           </label>
                           <button type="button" className="text-[10px] font-bold text-primary hover:underline">Esqueceu?</button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-14 py-4 rounded-xl bg-muted/40 border border-border/50 focus:bg-background focus:border-primary focus:ring-8 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-medium shadow-sm"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                       <button
                           type="submit"
                           disabled={loading}
                           className="w-full gradient-brand text-primary-foreground py-4 rounded-xl font-black text-sm shadow-xl shadow-primary/10 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                       >
                           {loading ? (
                               <Loader2 className="w-5 h-5 animate-spin" />
                           ) : (
                               <>
                                  ENTRAR NO SISTEMA
                                  <ArrowRight className="w-4 h-4" />
                               </>
                           )}
                       </button>
                    </div>
                </form>

                <div className="mt-10 pt-8 border-t border-border/40 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                       <ShieldCheck className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Acesso Criptografado</span>
                    </div>
                </div>

                {/* Decorative border accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 pointer-events-none" />
            </motion.div>

            {/* Bottom Credit */}
            <div className="absolute bottom-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">
               Secure Environment • Anteffa Group
            </div>
        </div>
    );
}

