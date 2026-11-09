import type { Entry } from './types'
import type { TFn } from './i18n'

export function entryLabel(e: Entry, t: TFn): string {
  if (e.type === 'payment') return t('paymentReceivedLabel')
  if (e.type === 'reversal') return t('entryCancelled')
  if (e.type === 'opening') return t('oldBalance')
  return t('goodsAdded')
}

export function formatWhen(ms: number, lang: string = 'en'): string {
  return new Date(ms).toLocaleString(lang === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export const normName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
