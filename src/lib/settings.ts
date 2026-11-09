import type { Lang } from './i18n'

export function getLang(): Lang {
  try {
    return localStorage.getItem('lang') === 'te' ? 'te' : 'en'
  } catch {
    return 'en'
  }
}

export function saveLang(l: Lang) {
  try {
    localStorage.setItem('lang', l)
  } catch {
    /* storage unavailable: ignore */
  }
}

/** Voice recognition language follows the app language. */
export const getVoiceLang = () => (getLang() === 'te' ? 'te-IN' : 'en-IN')
