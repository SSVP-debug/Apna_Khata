import type { Lang } from './i18n'
import { enToTe, hasTelugu, teToEn } from './translit'
import { normName } from './labels'

interface NamedCustomer {
  name: string
  nameEn?: string
  nameTe?: string
}

/** The same name in both scripts. The typed name is kept as-is; the other one is auto-generated. */
export function variants(name: string): { en: string; te: string } {
  const n = name.trim()
  return hasTelugu(n) ? { te: n, en: teToEn(n) } : { en: n, te: enToTe(n) }
}

/** Name to show in the current app language. Works for old customers without stored variants. */
export function displayName(c: NamedCustomer, lang: Lang): string {
  const v = variants(c.name)
  return lang === 'te' ? c.nameTe?.trim() || v.te : c.nameEn?.trim() || v.en
}

/** Every spelling of this customer's name, normalised, for search and duplicate detection. */
export function allNames(c: NamedCustomer): string[] {
  const v = variants(c.name)
  return [...new Set([c.name, c.nameEn, c.nameTe, v.en, v.te].filter((s): s is string => !!s?.trim()).map(normName))]
}
