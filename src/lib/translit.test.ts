import { describe, expect, it } from 'vitest'
import { enToTe, ruleEnToTe, teToEn } from './translit'
import { allNames, displayName, variants } from './names'

describe('transliteration', () => {
  it('English -> Telugu for common names (dictionary)', () => {
    expect(enToTe('Ramesh')).toBe('రమేష్')
    expect(enToTe('Lakshmi')).toBe('లక్ష్మి')
    expect(enToTe('Venkatesh Reddy')).toBe('వెంకటేష్ రెడ్డి')
  })
  it('Telugu -> English for common names', () => {
    expect(teToEn('రమేష్')).toBe('Ramesh')
    expect(teToEn('కృష్ణ')).toBe('Krishna')
    expect(teToEn('లక్ష్మి')).toBe('Lakshmi')
    expect(teToEn('సీత')).toBe('Sita')
  })
  it('Telugu -> English rules work beyond the dictionary', () => {
    expect(teToEn('వెంకటేష్')).toBe('Venkatesh')
    expect(teToEn('రాముడు')).toBe('Ramudu')
    expect(teToEn('సత్యం')).toBe('Satyam')
  })
  it('English -> Telugu rules produce sensible Telugu', () => {
    expect(ruleEnToTe('ramesh')).toBe('రమేష్')
    expect(ruleEnToTe('suresh')).toBe('సురేష్')
    expect(ruleEnToTe('lakshmi')).toBe('లక్ష్మి')
    expect(ruleEnToTe('ravi')).toBe('రవి')
  })
  it('displays the name in the current language', () => {
    const c = { name: 'Ramesh' }
    expect(displayName(c, 'en')).toBe('Ramesh')
    expect(displayName(c, 'te')).toBe('రమేష్')
    const t = { name: 'సురేష్' }
    expect(displayName(t, 'en')).toBe('Suresh')
    expect(displayName(t, 'te')).toBe('సురేష్')
  })
  it('uses owner-corrected names when stored', () => {
    expect(displayName({ name: 'Ramesh', nameTe: 'రమేశ్' }, 'te')).toBe('రమేశ్')
  })
  it('matches the same person across scripts', () => {
    const existing = allNames({ name: 'Ramesh' })
    expect(existing).toContain('రమేష్')
    expect(variants('రమేష్').en).toBe('Ramesh')
  })
})
