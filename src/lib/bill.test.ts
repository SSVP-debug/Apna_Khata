import { describe, expect, it } from 'vitest'
import { billNo, buildBillText, prepareShare, waDigits, waLink } from './bill'
import type { Entry } from './types'

const bill = (extra: Partial<Entry> = {}, n = 3): Entry => ({
  id: 'a3f2c1d0-0000-4000-8000-000000000000', customerId: 'c', type: 'bill', sign: 1, amountPaise: 40500,
  occurredAt: new Date(2026, 10, 10, 15, 42).getTime(), createdBy: 'u', mode: 'itemized',
  items: [
    { name: 'Rice', qty: 2, unit: 'kg', unitPricePaise: 6000, lineTotalPaise: 12000 },
    { name: 'Oil', qty: 1, unit: 'packet', unitPricePaise: 15000, lineTotalPaise: 15000 },
    { name: 'Sugar', qty: 3, unit: 'kg', unitPricePaise: 4500, lineTotalPaise: 13500 },
  ].slice(0, n),
  ...extra,
})
const base = { shopName: 'Sai Kirana', shopPhone: '9876543210', customerName: 'Ramesh', balanceAfterPaise: 90500, lang: 'en' as const }

describe('WhatsApp numbers', () => {
  it('adds +91 to a 10-digit number', () => {
    expect(waDigits('98765 43210')).toBe('919876543210')
    expect(waDigits('+91 98765-43210')).toBe('919876543210')
    expect(waDigits('09876543210')).toBe('919876543210')
  })
  it('rejects invalid numbers', () => {
    expect(waDigits('12345')).toBeNull()
    expect(waDigits('5876543210')).toBeNull() // Indian mobiles start with 6-9
    expect(waDigits('')).toBeNull()
  })
  it('keeps other country codes when typed with +', () => {
    expect(waDigits('+1 415 555 0100')).toBe('14155550100')
  })
})

describe('bill text', () => {
  it('has a stable bill number', () => {
    expect(billNo(bill())).toBe('KH-1011-A3F2')
  })
  it('shows a credit bill with balance due', () => {
    const t = buildBillText({ ...base, bill: bill() })
    expect(t).toContain('*Sai Kirana*')
    expect(t).toContain('1. Rice: 2 kg × ₹60.00 = ₹120.00')
    expect(t).toContain('*Total: ₹405.00*')
    expect(t).toContain('Balance due: ₹905.00')
    expect(t).not.toContain('Paid')
  })
  it('shows a paid bill without balance', () => {
    const t = buildBillText({ ...base, bill: bill({ settledBy: 'upi' }) })
    expect(t).toContain('✅ Paid (UPI)')
    expect(t).not.toContain('Balance due')
  })
  it('falls back to the app name when the shop name is empty', () => {
    expect(buildBillText({ ...base, shopName: '', bill: bill() })).toContain('*Apna Khata*')
  })
  it('builds a Telugu bill', () => {
    const t = buildBillText({ ...base, lang: 'te', bill: bill({ settledBy: 'cash' }) })
    expect(t).toContain('బిల్లు నం')
    expect(t).toContain('చెల్లించారు')
  })
  it('uses a compact layout for very long bills', () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ name: `బియ్యం రకం ${i}`, qty: 2, unit: 'kg', unitPricePaise: 6000, lineTotalPaise: 12000 }))
    const r = prepareShare({ ...base, lang: 'te', bill: bill({ items }) })
    expect(r.text).not.toContain('×')
  })
  it('makes a wa.me link with the encoded text', () => {
    expect(waLink('919876543210', 'Hi there')).toBe('https://wa.me/919876543210?text=Hi%20there')
  })
})
