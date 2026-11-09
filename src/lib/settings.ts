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

export function getLastSync(): number | null {
  try {
    const v = localStorage.getItem('lastSync')
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function saveLastSync(ms: number) {
  try {
    localStorage.setItem('lastSync', String(ms))
  } catch {
    /* ignore */
  }
}
