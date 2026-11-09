import { describe, expect, it } from 'vitest'
import { parseItems } from './parseItems'

describe('parseItems', () => {
  it('parses the spec example', () => {
    expect(parseItems('Two kg rice 120, one oil packet 150, three kg sugar 135.')).toEqual([
      { name: 'Rice', qty: 2, unit: 'kg', amountPaise: 12000 },
      { name: 'Oil', qty: 1, unit: 'packet', amountPaise: 15000 },
      { name: 'Sugar', qty: 3, unit: 'kg', amountPaise: 13500 },
    ])
  })
  it('handles digits glued to units and "and"', () => {
    const r = parseItems('2kg rice 120 and 1 kg sugar 45')
    expect(r.map((i) => [i.name, i.qty, i.amountPaise])).toEqual([['Rice', 2, 12000], ['Sugar', 1, 4500]])
  })
  it('defaults qty to 1 when only amount is spoken', () => {
    expect(parseItems('rice 120')[0]).toMatchObject({ name: 'Rice', qty: 1, amountPaise: 12000 })
  })
  it('does not guess a missing amount', () => {
    expect(parseItems('2 kg rice')[0]).toMatchObject({ name: 'Rice', qty: 2, unit: 'kg', amountPaise: null })
  })
  it('handles half and ignores "total"', () => {
    const r = parseItems('half kg sugar 25, total 25')
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ qty: 0.5, amountPaise: 2500 })
  })
  it('parses Telugu word order (item, qty, unit, amount in words)', () => {
    expect(parseItems('బియ్యం రెండు కిలోలు నూట ఇరవై')[0]).toEqual({ name: 'బియ్యం', qty: 2, unit: 'kg', amountPaise: 12000 })
  })
  it('parses Telugu fractions and compound numbers', () => {
    expect(parseItems('అర కిలో పంచదార ఇరవై ఐదు')[0]).toMatchObject({ qty: 0.5, unit: 'kg', amountPaise: 2500 })
    expect(parseItems('నూనె ప్యాకెట్ రెండు వందల యాభై')[0]).toMatchObject({ unit: 'packet', amountPaise: 25000 })
  })
  it('parses Telugu digits and mixed digits', () => {
    expect(parseItems('బియ్యం ౨ కిలో ౧౨౦')[0]).toMatchObject({ qty: 2, amountPaise: 12000 })
    expect(parseItems('పప్పు 1 కిలో 140')[0]).toMatchObject({ name: 'పప్పు', qty: 1, unit: 'kg', amountPaise: 14000 })
  })
  it('splits Telugu items on మరియు', () => {
    expect(parseItems('బియ్యం 2 కిలో 120 మరియు నూనె 1 లీటర్ 150')).toHaveLength(2)
  })
  it('English compound numbers', () => {
    expect(parseItems('oil one litre two hundred fifty')[0]).toMatchObject({ qty: 1, unit: 'litre', amountPaise: 25000 })
  })
})
