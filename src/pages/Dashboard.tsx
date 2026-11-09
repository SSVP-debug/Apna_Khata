import { useStore } from '../lib/storeContext'
import { balancesByCustomer, todayTotals } from '../lib/ledger'
import { formatINR } from '../lib/money'
import type { View } from '../App'

export default function Dashboard({ go }: { go: (v: View) => void }) {
  const { entries, customers, pending, online } = useStore()
  const bal = balancesByCustomer(entries)
  const outstanding = [...bal.values()].reduce((s, v) => s + v, 0)
  const t = todayTotals(entries)
  const recent = [...entries].sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 5)
  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="flex flex-col gap-3">
      <div className="card">
        <p className="text-slate-600">Total outstanding</p>
        <p className="text-4xl font-bold text-red-700">{formatINR(outstanding)}</p>
        {pending > 0 && <p className="mt-1 text-sm text-amber-700">Includes {pending} unsynced record(s)</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-sm text-slate-600">Today's credit</p><p className="text-xl font-bold">{formatINR(t.sales)}</p></div>
        <div className="card"><p className="text-sm text-slate-600">Today's payments</p><p className="text-xl font-bold text-teal-700">{formatINR(t.payments)}</p></div>
        <div className="card"><p className="text-sm text-slate-600">Customers</p><p className="text-xl font-bold">{customers.filter((c) => c.isActive).length}</p></div>
        <div className="card"><p className="text-sm text-slate-600">Sync</p><p className="text-xl font-bold">{!online ? 'Offline' : pending ? `${pending} pending` : 'All synced'}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => go({ name: 'bill' })}>+ Bill</button>
        <button className="btn-primary" onClick={() => go({ name: 'payment' })}>+ Payment</button>
        <button className="btn-ghost" onClick={() => go({ name: 'customers', add: true })}>Add customer</button>
        <button className="btn-ghost" onClick={() => go({ name: 'ledger' })}>View ledger</button>
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold">Recent</h2>
        {recent.length === 0 && <p className="text-slate-500">No transactions yet.</p>}
        {recent.map((e) => (
          <div key={e.id} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
            <span>{name(e.customerId)} <span className="text-xs text-slate-500">{e.type}{e.pending && ' ⏳'}</span></span>
            <span className={e.sign === 1 ? 'text-red-700' : 'text-teal-700'}>{e.sign === 1 ? '+' : '-'}{formatINR(e.amountPaise)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
