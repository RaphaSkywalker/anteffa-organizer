import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { navItems, bottomItems } from "@/lib/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out shrink-0 z-40 relative",
        collapsed ? "w-[80px]" : "w-[240px]"
      )}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 h-20">
         <div className="w-10 h-10 shrink-0 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center bg-white/10">
            <img src="/logo-anteffa.png" alt="Logo" className="w-full h-full object-cover" />
         </div>
         {!collapsed && (
            <div className="flex flex-col">
               <h1 className="font-black text-foreground text-sm tracking-tighter leading-none">
                  ANTEFFA
               </h1>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">
                  ADMINISTRATIVO
               </p>
            </div>
         )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {!collapsed && (
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-4 opacity-50">Menu</p>
        )}
        {navItems.filter(item => {
          if (item.key === "nav.gestao") {
            return user?.team_name === "Financeiro" || user?.role === "admin" || user?.team_name === "Presidência";
          }
          return true;
        }).map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />
              {!collapsed && <span>{t(item.key)}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground animate-in zoom-in" />
              )}
              {collapsed && isActive && (
                 <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </NavLink>
          );
        })}

        {!collapsed && (
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mt-8 mb-4 opacity-50">Geral</p>
        )}
        {bottomItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{t(item.key)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className={cn("flex flex-col gap-2", collapsed && "items-center")}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 shrink-0 text-slate-700" />
            )}
            {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-2 flex items-center justify-center w-full py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                 <ChevronLeft className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

