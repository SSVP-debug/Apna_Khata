import { describe, expect, it } from 'vitest'
import { buildWholesaleOrderMessage, normalizeIndianWhatsAppNumber } from './wholesaleOrder'

describe('normalizeIndianWhatsAppNumber', () => {
  it('adds the India code to a valid 10-digit number', () => expect(normalizeIndianWhatsAppNumber('98765 43210')).toBe('919876543210'))
  it('accepts an existing India code', () => expect(normalizeIndianWhatsAppNumber('+91 98765-43210')).toBe('919876543210'))
  it('rejects invalid mobile numbers', () => {
    expect(normalizeIndianWhatsAppNumber('12345')).toBeNull()
    expect(normalizeIndianWhatsAppNumber('5123456789')).toBeNull()
  })
})

describe('buildWholesaleOrderMessage', () => {
  it('formats quantities without inventing prices', () => {
    const message = buildWholesaleOrderMessage('My Store', '11 Nov 2026', [
      { name: 'Rice', qty: 2, unit: 'bags' }, { name: 'Sugar', qty: 10, unit: 'kg' },
    ])
    expect(message).toContain('2. Sugar – 10 kg')
    expect(message).toContain('Please confirm availability and prices.')
  })
})
