import { describe, expect, it } from 'vitest'
import { findProduct, priceFor, productId, type Product } from './products'

const p = (name: string, unit: string, price: number, uses = 1): Product => ({
  id: productId(name, unit), name, normalizedName: name.toLowerCase(), unit, unitPricePaise: price, uses, updatedAt: 1,
})

describe('product memory', () => {
  it('uses a stable id for the same item+unit', () => {
    expect(productId('Rice', 'kg')).toBe(productId('  rice ', 'KG'))
    expect(productId('Rice', 'kg')).not.toBe(productId('Rice', 'packet'))
  })
  it('suggests the saved price for "Rice 2 kg"', () => {
    const f = findProduct([p('Rice', 'kg', 6000)], 'rice', 'kg')
    expect(f && priceFor(f, 2)).toBe(12000)
  })
  it('does not suggest when the unit differs', () => {
    expect(findProduct([p('Rice', 'kg', 6000)], 'Rice', 'packet')).toBeUndefined()
  })
  it('picks the most-used when no unit was spoken', () => {
    const f = findProduct([p('Oil', 'packet', 15000, 2), p('Oil', 'litre', 16000, 9)], 'Oil', '')
    expect(f?.unit).toBe('litre')
  })
  it('matches simple plurals and Telugu names', () => {
    expect(findProduct([p('Onion', 'kg', 3000)], 'Onions', 'kg')).toBeDefined()
    expect(findProduct([p('బియ్యం', 'kg', 6000)], 'బియ్యం', 'kg')).toBeDefined()
  })
  it('handles fractional quantities', () => {
    expect(priceFor(p('Sugar', 'kg', 4500), 0.5)).toBe(2250)
  })
})
