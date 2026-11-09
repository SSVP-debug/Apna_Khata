import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { toCSV, balancesByCustomer } from '../lib/ledger'
import { formatINR } from '../lib/money'

export default function Ledger() {
  const { entries, customers } = useStore()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? '—'

  const rows = entries
    .filter((e) => (!from || e.occurredAt >= new Date(from).getTime()) && (!to || e.occurredAt <= new Date(to).getTime() + 86399999))
    .sort((a, b) => b.occurredAt - a.occurredAt)
  const bal = balancesByCustomer(entries)

  function exportCSV() {
    const csv = toCSV([
      ['Date', 'Customer', 'Type', 'Method', 'Debit (INR)', 'Credit (INR)', 'Description'],
      ...[...rows].reverse().map((e) => [
        new Date(e.occurredAt).toISOString().slice(0, 10), name(e.customerId), e.type, e.method ?? '',
        e.sign === 1 ? (e.amountPaise / 100).toFixed(2) : '', e.sign === -1 ? (e.amountPaise / 100).toFixed(2) : '',
        e.description ?? '',
      ]),
    ])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `apna-khata-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-col gap-2">
        <div className="flex gap-2">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-ghost" onClick={exportCSV}>Export CSV</button>
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold">Customer-wise outstanding</h2>
        {customers.filter((c) => (bal.get(c.id) ?? 0) !== 0).map((c) => (
          <div key={c.id} className="flex justify-between py-1"><span>{c.name}</span><b>{formatINR(bal.get(c.id) ?? 0)}</b></div>
        ))}
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold">All transactions</h2>
        {rows.map((e) => (
          <div key={e.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
            <span>
              {new Date(e.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {name(e.customerId)}
              <span className="text-xs text-slate-500"> {e.type}{e.pending && ' ⏳'}</span>
            </span>
            <span className={e.sign === 1 ? 'text-red-700' : 'text-teal-700'}>{e.sign === 1 ? '+' : '-'}{formatINR(e.amountPaise)}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-500">No transactions.</p>}
      </div>
    </div>
  )
}
