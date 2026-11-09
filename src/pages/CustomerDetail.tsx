import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { reverseEntry, updateCustomer } from '../lib/db'
import { balanceOf } from '../lib/ledger'
import { formatINR } from '../lib/money'
import LedgerTable from '../components/LedgerTable'
import EntryForm from '../components/EntryForm'
import type { View } from '../App'

export default function CustomerDetail({ id, go }: { id: string; go: (v: View) => void }) {
  const { shopId, uid, customers, entries } = useStore()
  const c = customers.find((x) => x.id === id)
  const mine = entries.filter((e) => e.customerId === id)
  const [form, setForm] = useState<'bill' | 'payment' | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  if (!c) return <p className="text-slate-500">Loading customer…</p>

  const filtered = mine.filter((e) => {
    if (from && e.occurredAt < new Date(from).getTime()) return false
    if (to && e.occurredAt > new Date(to).getTime() + 86399999) return false
    return true
  })

  return (
    <div className="flex flex-col gap-3">
      <button className="self-start text-teal-800 underline" onClick={() => go({ name: 'customers' })}>← Customers</button>
      <div className="card">
        <h2 className="text-xl font-bold">{c.name} {!c.isActive && <span className="text-sm text-slate-500">(inactive)</span>}</h2>
        <p className="text-slate-500">{c.phone} {c.notes && `· ${c.notes}`}</p>
        <p className="mt-2 text-sm text-slate-600">Outstanding</p>
        <p className="text-4xl font-bold text-red-700">{formatINR(balanceOf(mine))}</p>
        <div className="mt-3 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => { setName(c.name); setPhone(c.phone); setNotes(c.notes); setEditing(!editing) }}>Edit</button>
          <button className="btn-ghost flex-1" onClick={() => updateCustomer(shopId, c.id, { isActive: !c.isActive })}>
            {c.isActive ? 'Mark inactive' : 'Restore'}
          </button>
        </div>
      </div>

      {editing && (
        <div className="card flex flex-col gap-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn-primary" onClick={() => {
            if (!name.trim()) return
            updateCustomer(shopId, c.id, { name: name.trim(), phone: phone.trim(), notes: notes.trim() })
            setEditing(false)
          }}>Save</button>
        </div>
      )}

      {form ? (
        <EntryForm type={form} presetCustomerId={id} onDone={() => setForm(null)} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => setForm('bill')}>+ Bill</button>
          <button className="btn-primary" onClick={() => setForm('payment')}>+ Payment</button>
        </div>
      )}

      <div className="card">
        <div className="mb-2 flex gap-2">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <LedgerTable entries={filtered} onReverse={(e) => {
          if (confirm(`Reverse this ${e.type} of ${formatINR(e.amountPaise)}?`)) reverseEntry(shopId, uid, e)
        }} />
      </div>
    </div>
  )
}
