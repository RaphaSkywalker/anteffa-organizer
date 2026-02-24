import { useI18n } from "@/contexts/I18nContext";

const flags = [
  { code: "pt" as const, flag: "🇧🇷", label: "PT" },
  { code: "en" as const, flag: "🇺🇸", label: "EN" },
  { code: "es" as const, flag: "🇪🇸", label: "ES" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex gap-1">
      {flags.map((f) => (
        <button
          key={f.code}
          onClick={() => setLanguage(f.code)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            language === f.code
              ? "bg-sidebar-primary/20 text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <span className="text-base">{f.flag}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
