import { describe, expect, it } from 'vitest'
import { formatINR, lineTotal, normalizePhone, parseRupees } from './money'

describe('money helpers', () => {
  it('parses rupees into paise without losing decimals', () => {
    expect(parseRupees('250.50')).toBe(25050)
    expect(parseRupees('250')).toBe(25000)
  })
  it('rejects invalid and unsafe amounts', () => {
    expect(parseRupees('-10')).toBeNull()
    expect(parseRupees('1.234')).toBeNull()
    expect(parseRupees('999999999999999999999')).toBeNull()
  })
  it('formats Indian rupees', () => { expect(formatINR(123456)).toBe('₹1,234.56') })
  it('normalizes Indian phone prefixes', () => {
    expect(normalizePhone('+91 9876543210')).toBe('9876543210')
    expect(normalizePhone('09876543210')).toBe('9876543210')
  })
  it('multiplies quantity and unit price in paise', () => { expect(lineTotal(2, 12500)).toBe(25000) })
})
