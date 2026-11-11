import { describe, expect, it } from 'vitest'
import { parseItems } from './parseItems'

describe('parseItems', () => {
  it('parses common English items', () => {
    expect(parseItems('Two kg rice 120, one oil packet 150, three kg sugar 135.')).toEqual([
      { name: 'Rice', qty: 2, unit: 'kg', amountPaise: 12000 },
      { name: 'Oil', qty: 1, unit: 'packet', amountPaise: 15000 },
      { name: 'Sugar', qty: 3, unit: 'kg', amountPaise: 13500 },
    ])
  })
  it('handles digits joined to units and separates items on and', () => {
    expect(parseItems('2kg rice 120 and 1 kg sugar 45').map((item) => [item.name, item.qty, item.amountPaise]))
      .toEqual([['Rice', 2, 12000], ['Sugar', 1, 4500]])
  })
  it('uses quantity one when the owner says only an item and amount', () => {
    expect(parseItems('rice 120')[0]).toMatchObject({ name: 'Rice', qty: 1, amountPaise: 12000 })
  })
  it('leaves missing amounts blank for the owner to fill', () => {
    expect(parseItems('2 kg rice')[0]).toMatchObject({ name: 'Rice', qty: 2, unit: 'kg', amountPaise: null })
  })
  it('handles half quantities and ignores a spoken total', () => {
    expect(parseItems('half kg sugar 25, total 25')).toHaveLength(1)
    expect(parseItems('half kg sugar 25')[0]).toMatchObject({ qty: 0.5, amountPaise: 2500 })
  })
  it('understands common Telugu item order', () => {
    expect(parseItems('బియ్యం రెండు కిలోలు నూట ఇరవై')[0]).toEqual({ name: 'బియ్యం', qty: 2, unit: 'kg', amountPaise: 12000 })
  })
  it('handles Telugu digits and amounts', () => {
    expect(parseItems('బియ్యం ౨ కిలో ౧౨౦')[0]).toMatchObject({ qty: 2, amountPaise: 12000 })
  })
  it('does not create an item from text without a product name', () => {
    expect(parseItems('120')).toEqual([])
    expect(parseItems('')).toEqual([])
  })
  it('does not turn a zero quantity into one', () => {
    expect(parseItems('0 kg rice 100')).toEqual([])
  })
})
