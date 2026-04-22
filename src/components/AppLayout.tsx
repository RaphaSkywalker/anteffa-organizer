import { API_URL } from "../config";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Search, Bell, Mail, Command, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn, safeDate } from "@/lib/utils";
import { navItems, bottomItems } from "@/lib/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout() {
  const { t } = useI18n();
  const { user, api, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [upcomingRemindersCount, setUpcomingRemindersCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchUnreadTotal = async () => {
    try {
      const chatData = await api(`/api/messages/unread?t=${Date.now()}`);
      if (Array.isArray(chatData)) {
        const total = chatData.reduce((acc: number, curr: any) => acc + curr.count, 0);
        setUnreadChatCount(total);
      }

      const mailData = await api(`/api/mail/unread?t=${Date.now()}`);
      if (mailData && typeof mailData.count === 'number') {
        setUnreadMailCount(mailData.count);
      }

      const agendaData = await api(`/api/agenda?t=${Date.now()}`);
      if (Array.isArray(agendaData)) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const criticalCount = agendaData.filter((event: any) => {
          if (event.event_type !== 'lembrete' || !event.reminder_days) return false;
          const eventDate = safeDate(event.start_date);
          eventDate.setHours(0, 0, 0, 0);
          const diffTime = eventDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= event.reminder_days && diffDays >= 0;
        }).length;
        setUpcomingRemindersCount(criticalCount);
      }
    } catch (error) {
      console.error("Error fetching header unread count:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadTotal();
      const interval = setInterval(fetchUnreadTotal, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans select-none">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 z-50 shrink-0">
          
          {/* Mobile Logo & Toggle */}
          <div className="flex lg:hidden items-center mr-4">
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="flex items-center gap-2.5 p-1 rounded-full hover:bg-muted transition-all active:scale-95 group"
             >
                <div className="w-10 h-10 shrink-0 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center bg-white/10">
                   <img src="/logo-anteffa.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-300",
                  isMobileMenuOpen ? "rotate-180" : "rotate-0"
                )} />
             </button>
          </div>

          {/* Spacing to push right actions */}
          <div className="flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-3 lg:gap-6">
             <div className="flex items-center gap-1 lg:gap-2">
                <Link to="/messages" className="p-2 lg:p-2.5 rounded-lg text-muted-foreground hover:bg-muted font-medium transition-colors relative group">
                   <Mail className="w-4 h-4 lg:w-5 h-5 group-hover:scale-110 transition-transform" />
                   {unreadMailCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
                   )}
                </Link>
                <Link to="/" className="p-2 lg:p-2.5 rounded-lg text-muted-foreground hover:bg-muted font-medium transition-colors relative group">
                   <Bell className="w-4 h-4 lg:w-5 h-5 group-hover:scale-110 transition-transform" />
                   {(unreadChatCount > 0 || upcomingRemindersCount > 0) && (
                      <span className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                   )}
                </Link>
             </div>

             <div className="h-6 lg:h-8 w-px bg-border mx-1 lg:mx-2 hidden xs:block" />

             {/* Profile */}
             <Link to="/settings" className="flex items-center gap-2 lg:gap-3 pl-1 lg:pl-2 group">
                <div className="text-right hidden sm:block">
                   <p className="text-xs lg:text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors">{user?.name || user?.username}</p>
                   <p className="text-[9px] lg:text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">{user?.role === 'admin' ? 'Adm' : 'Colab'}</p>
                </div>
                <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-muted border-2 border-background shadow-md overflow-hidden shrink-0 group-hover:border-primary/30 transition-all">
                   {user?.avatar_url ? (
                      <img 
                        src={`${API_URL}${user.avatar_url}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                   ) : (
                      <div className="w-full h-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-base lg:text-lg">
                         {(user?.name || user?.username)?.[0].toUpperCase()}
                      </div>
                   )}
                </div>
             </Link>
          </div>
        </header>

        {/* Mobile Navbar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 lg:hidden"
              />
              {/* Menu */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-20 left-0 right-0 bg-card border-b border-border shadow-2xl z-40 lg:hidden overflow-hidden"
              >
                <div className="p-6 space-y-1">
                  {navItems.filter(item => {
                    if (item.key === "nav.gestao") {
                      return user?.team_name === "Financeiro" || user?.role === "admin" || user?.team_name === "Presidência";
                    }
                    return true;
                  }).map((item) => {
                    const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                          isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{t(item.key)}</span>
                      </NavLink>
                    );
                  })}
                  
                  <div className="my-4 h-px bg-border mx-2" />
                  
                  {bottomItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                          isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{t(item.key)}</span>
                      </NavLink>
                    );
                  })}

                  <div className="pt-4 grid grid-cols-2 gap-3">
                     <button 
                       onClick={toggleTheme}
                       className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-muted/30 text-xs font-bold text-foreground active:scale-95"
                     >
                       {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                       Tema
                     </button>
                     <button 
                       onClick={logout}
                       className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs font-bold text-destructive active:scale-95"
                     >
                       <LogOut className="w-4 h-4" />
                       Sair
                     </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
