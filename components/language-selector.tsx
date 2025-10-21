"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
        {t("settings.language")}
      </h3>
      <p className="text-sm text-slate-400">{t("settings.language.desc")}</p>
      <div className="flex space-x-3">
        {[
          { code: "en", label: t("settings.english") },
          { code: "tl", label: t("settings.tagalog") },
        ].map((lang) => (
          <Button
            key={lang.code}
            size="lg"
            onClick={() => setLanguage(lang.code as "en" | "tl")}
            className={`flex-1 h-12 rounded-2xl font-medium transition-all ${
              language === lang.code
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                : "bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/60"
            }`}
          >
            {lang.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
