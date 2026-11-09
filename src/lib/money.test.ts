import { describe, expect, it } from 'vitest'
import { formatINR, lineTotal, normalizePhone, parseRupees } from './money'
import { balanceOf } from './ledger'
import type { Entry } from './types'

const e = (type: Entry['type'], sign: 1 | -1, amountPaise: number): Entry => ({
  id: crypto.randomUUID(), customerId: 'c', type, sign, amountPaise, occurredAt: 0, createdBy: 'u',
})

describe('money', () => {
  it('parses rupees to paise', () => {
    expect(parseRupees('250')).toBe(25000)
    expect(parseRupees('250.5')).toBe(25050)
    expect(parseRupees('0.07')).toBe(7)
    expect(parseRupees('0')).toBeNull()
    expect(parseRupees('-5')).toBeNull()
    expect(parseRupees('abc')).toBeNull()
  })
  it('formats INR', () => {
    expect(formatINR(150000)).toBe('₹1,500.00')
  })
  it('normalizes phone', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('9876543210')
    expect(normalizePhone('09876543210')).toBe('9876543210')
  })
  it('line total', () => {
    expect(lineTotal(2, 6000)).toBe(12000)
    expect(lineTotal(0.5, 4500)).toBe(2250)
  })
  it('balance: opening + bills - payments (spec example)', () => {
    const entries = [e('opening', 1, 150000), e('bill', 1, 50000), e('payment', -1, 70000)]
    expect(balanceOf(entries)).toBe(130000)
  })
})
