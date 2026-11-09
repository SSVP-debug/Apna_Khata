/** Parse "250" or "250.50" into integer paise. Returns null if invalid or <= 0. */
export function parseRupees(input: string): number | null {
  const s = input.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const [r, p = ''] = s.split('.')
  const paise = Number(r) * 100 + Number(p.padEnd(2, '0'))
  return paise > 0 ? paise : null
}

export function formatINR(paise: number): string {
  const neg = paise < 0
  const abs = Math.abs(paise)
  const txt = (abs / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${neg ? '-' : ''}₹${txt}`
}

/** Digits only; drops +91 / 91 / leading 0 prefix; keeps last 10 digits. */
export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

/** qty (decimal) x unit price (paise) -> integer paise */
export function lineTotal(qty: number, unitPricePaise: number): number {
  return Math.round(qty * unitPricePaise)
}
