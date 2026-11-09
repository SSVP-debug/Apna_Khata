import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { translate, type Lang } from './i18n'
import { getLang, saveLang } from './settings'
import { LangContext } from './langContext'

export default function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang())
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const value = useMemo(
    () => ({
      lang,
      setLang: (l: Lang) => { saveLang(l); setLangState(l) },
      t: (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(lang, key, vars),
    }),
    [lang],
  )
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
