import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Lang = "en" | "zh";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (en: string, zh: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("okx-ai-core-lang");
      if (saved === "en" || saved === "zh") return saved;
      return navigator.language.startsWith("zh") ? "zh" : "en";
    }
    return "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("okx-ai-core-lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem("okx-ai-core-lang", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (en: string, zh: string) => (lang === "en" ? en : zh),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
