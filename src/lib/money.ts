/** Parse "250" or "250.50" into integer paise. Returns null if invalid or <= 0. */
export function parseRupees(input: string): number | null {
  const value = input.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null
  const [rupees, paise = ''] = value.split('.')
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, '0'))
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null
}

export function formatINR(paise: number): string {
  const negative = paise < 0
  const amount = Math.abs(paise)
  const text = (amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${negative ? '-' : ''}₹${text}`
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

export function lineTotal(quantity: number, unitPricePaise: number): number {
  return Math.round(quantity * unitPricePaise)
}
