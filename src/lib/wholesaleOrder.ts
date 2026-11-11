export interface WholesaleOrderItem { name: string; qty: number; unit: string }

export function normalizeIndianWhatsAppNumber(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`
  if (/^91[6-9]\d{9}$/.test(digits)) return digits
  return null
}

export function buildWholesaleOrderMessage(shopName: string, date: string, items: WholesaleOrderItem[]): string {
  const lines = items.map((item, index) => `${index + 1}. ${item.name.trim()} – ${item.qty} ${item.unit.trim()}`)
  return ['APNA KHATA', 'GOODS ORDER', '', ...(shopName.trim() ? [`Shop: ${shopName.trim()}`] : []),
    `Date: ${date}`, '', ...lines, '', 'Please confirm availability and prices.', 'Thank you.'].join('\n')
}
