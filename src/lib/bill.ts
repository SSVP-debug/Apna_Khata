import type { Entry } from './types'
import { formatINR, normalizePhone } from './money'
import { translate, type Lang } from './i18n'

export const MAX_URL_LEN = 5500

/** Readable bill number derived from the entry itself (no counter, so it never clashes offline). */
export function billNo(e: Pick<Entry, 'id' | 'occurredAt'>): string {
  const d = new Date(e.occurredAt)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `KH-${dd}${mm}-${e.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

/** WhatsApp number in international format without "+", or null if invalid. Defaults to India (+91). */
export function waDigits(raw: string): string | null {
  const trimmed = raw.trim()
  const d = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && !d.startsWith('91')) return d.length >= 8 && d.length <= 15 ? d : null
  const n = normalizePhone(trimmed)
  return /^[6-9]\d{9}$/.test(n) ? `91${n}` : null
}

export interface BillInput {
  shopName: string
  shopPhone: string
  bill: Entry
  customerName: string
  balanceAfterPaise: number
  lang: Lang
}

function when(ms: number, lang: Lang): string {
  return new Date(ms).toLocaleString(lang === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

/** Plain-text bill for WhatsApp (*bold* markers are WhatsApp formatting). */
export function buildBillText(inp: BillInput, compact = false): string {
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(inp.lang, k, v)
  const { bill } = inp
  const line = '--------------------'
  const out: string[] = [`*${inp.shopName.trim() || 'Apna Khata'}*`]
  if (inp.shopPhone.trim()) out.push(`📞 ${inp.shopPhone.trim()}`)
  out.push(
    `${t('billNo')}: ${billNo(bill)}`,
    `${t('billDate')}: ${when(bill.occurredAt, inp.lang)}`,
    `${t('billCustomer')}: ${inp.customerName}`,
    line,
  )
  ;(bill.items ?? []).forEach((i, n) => {
    out.push(
      compact
        ? `${n + 1}. ${i.name} ${i.qty}${i.unit} ${formatINR(i.lineTotalPaise)}`
        : `${n + 1}. ${i.name}: ${i.qty} ${i.unit} × ${formatINR(i.unitPricePaise)} = ${formatINR(i.lineTotalPaise)}`,
    )
  })
  out.push(line, `*${t('billTotal')}: ${formatINR(bill.amountPaise)}*`)
  if (bill.settledBy) out.push(`✅ ${t('billPaid')} (${t(bill.settledBy)})`)
  else out.push(`📒 ${t('billOnKhata')}`, `${t('billBalance')}: ${formatINR(inp.balanceAfterPaise)}`)
  out.push('', t('billThanks'))
  return out.join('\n')
}

/** Message plus a wa.me link. Long Telugu bills get a compact layout; if still too long, send is disabled. */
export function prepareShare(inp: BillInput): { text: string; tooLong: boolean } {
  const full = buildBillText(inp)
  if (encodeURIComponent(full).length <= MAX_URL_LEN) return { text: full, tooLong: false }
  const compact = buildBillText(inp, true)
  return { text: compact, tooLong: encodeURIComponent(compact).length > MAX_URL_LEN }
}

export const waLink = (digits: string, text: string) => `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
