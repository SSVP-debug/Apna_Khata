import type { Entry } from './types'

export function balanceOf(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + entry.sign * entry.amountPaise, 0)
}

export function balancesByCustomer(entries: Entry[]): Map<string, number> {
  const balances = new Map<string, number>()
  for (const entry of entries) balances.set(entry.customerId, (balances.get(entry.customerId) ?? 0) + entry.sign * entry.amountPaise)
  return balances
}

export interface CustomerStats { balance: number; count: number; lastPaymentAt: number | null }

export function customerStats(entries: Entry[]): Map<string, CustomerStats> {
  const reversed = new Set(entries.filter((entry) => entry.reverses).map((entry) => entry.reverses))
  const result = new Map<string, CustomerStats>()
  for (const entry of entries) {
    const stats = result.get(entry.customerId) ?? { balance: 0, count: 0, lastPaymentAt: null }
    stats.balance += entry.sign * entry.amountPaise
    stats.count += 1
    if (entry.type === 'payment' && !reversed.has(entry.id) &&
      (stats.lastPaymentAt === null || entry.occurredAt > stats.lastPaymentAt)) stats.lastPaymentAt = entry.occurredAt
    result.set(entry.customerId, stats)
  }
  return result
}

export const isPaidUp = (stats: CustomerStats | undefined) => !!stats && stats.count > 0 && stats.balance <= 0

export function withRunning(entries: Entry[]): (Entry & { running: number })[] {
  const sorted = [...entries].sort((a, b) => a.occurredAt - b.occurredAt || a.id.localeCompare(b.id))
  let running = 0
  return sorted.map((entry) => {
    running += entry.sign * entry.amountPaise
    return { ...entry, running }
  })
}

export function startOfToday(): number {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Sales and payments recorded today, minus any cancellations recorded today for those entries. */
export function todayTotals(entries: Entry[]) {
  const start = startOfToday()
  const todays = entries.filter((entry) => entry.occurredAt >= start)
  const reversedIds = new Set(todays.filter((entry) => entry.reverses).map((entry) => entry.reverses))
  const sales = todays
    .filter((entry) => entry.type === 'bill' && !reversedIds.has(entry.id))
    .reduce((sum, entry) => sum + entry.amountPaise, 0)
  const payments = todays
    .filter((entry) => entry.type === 'payment' && !reversedIds.has(entry.id))
    .reduce((sum, entry) => sum + entry.amountPaise, 0)
  return { sales, payments }
}

export function toCSV(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function toJSONBackup(data: unknown): string {
  return JSON.stringify({ format: 'apna-khata-backup', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)
}
