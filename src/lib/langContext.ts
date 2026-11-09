import { createContext, useContext } from 'react'
import type { Lang, TFn } from './i18n'

export interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: TFn
}

export const LangContext = createContext<LangCtx | null>(null)

export function useLang(): LangCtx {
  const v = useContext(LangContext)
  if (!v) throw new Error('useLang outside provider')
  return v
}
