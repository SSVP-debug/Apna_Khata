import type { Entry } from './types'

export function balanceOf(entries: Entry[]): number {
  return entries.reduce((s, e) => s + e.sign * e.amountPaise, 0)
}

export function balancesByCustomer(entries: Entry[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of entries) m.set(e.customerId, (m.get(e.customerId) ?? 0) + e.sign * e.amountPaise)
  return m
}

export interface CustomerStats {
  balance: number
  count: number
  lastPaymentAt: number | null
}

/** Per-customer balance, entry count and the date of the last payment that was not cancelled. */
export function customerStats(entries: Entry[]): Map<string, CustomerStats> {
  const reversed = new Set(entries.filter((e) => e.reverses).map((e) => e.reverses))
  const m = new Map<string, CustomerStats>()
  for (const e of entries) {
    const s = m.get(e.customerId) ?? { balance: 0, count: 0, lastPaymentAt: null }
    s.balance += e.sign * e.amountPaise
    s.count += 1
    if (e.type === 'payment' && !reversed.has(e.id) && (s.lastPaymentAt === null || e.occurredAt > s.lastPaymentAt)) {
      s.lastPaymentAt = e.occurredAt
    }
    m.set(e.customerId, s)
  }
  return m
}

/** Paid up = has history and nothing owed (a negative balance means they paid in advance). */
export const isPaidUp = (s: CustomerStats | undefined) => !!s && s.count > 0 && s.balance <= 0

export function withRunning(entries: Entry[]): (Entry & { running: number })[] {
  const sorted = [...entries].sort((a, b) => a.occurredAt - b.occurredAt)
  let run = 0
  return sorted.map((e) => {
    run += e.sign * e.amountPaise
    return { ...e, running: run }
  })
}

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function todayTotals(entries: Entry[]) {
  const t = startOfToday()
  let sales = 0
  let payments = 0
  for (const e of entries) {
    if (e.occurredAt < t) continue
    if (e.type === 'bill') sales += e.amountPaise
    if (e.type === 'payment') payments += e.amountPaise
  }
  return { sales, payments }
}

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
