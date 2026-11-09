import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addCustomer } from '../lib/db'
import { balancesByCustomer } from '../lib/ledger'
import { formatINR, normalizePhone, parseRupees } from '../lib/money'
import type { View } from '../App'

export default function Customers({ go, startAdding }: { go: (v: View) => void; startAdding?: boolean }) {
  const { shopId, uid, customers, entries } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(!!startAdding)
  const [showInactive, setShowInactive] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [opening, setOpening] = useState('')
  const [dupOk, setDupOk] = useState(false)
  const [err, setErr] = useState('')

  const bal = balancesByCustomer(entries)
  const np = normalizePhone(phone)
  const dup = np.length >= 10 ? customers.find((c) => c.normalizedPhone === np) : undefined

  const list = customers
    .filter((c) => c.isActive !== showInactive)
    .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.normalizedPhone.includes(normalizePhone(q) || '\u0000'))
    .sort((a, b) => a.name.localeCompare(b.name))

  function save() {
    if (!name.trim()) return setErr('Enter customer name')
    let openingPaise = 0
    if (opening.trim()) {
      const p = parseRupees(opening)
      if (!p) return setErr('Opening balance must be a positive amount')
      openingPaise = p
    }
    if (dup && !dupOk) return setErr('Confirm the duplicate phone warning first')
    const id = addCustomer(shopId, uid, { name, phone, notes, openingPaise })
    setName(''); setPhone(''); setNotes(''); setOpening(''); setDupOk(false); setErr(''); setAdding(false)
    go({ name: 'customer', id })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input className="input" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary whitespace-nowrap" onClick={() => setAdding(!adding)}>{adding ? 'Close' : '+ New'}</button>
      </div>

      {adding && (
        <div className="card flex flex-col gap-2">
          <input className="input" placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" inputMode="tel" placeholder="Phone" value={phone} onChange={(e) => { setPhone(e.target.value); setDupOk(false) }} />
          {dup && (
            <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm">
              <p><b>{dup.name}</b> already uses this phone (owes {formatINR(bal.get(dup.id) ?? 0)}).</p>
              <div className="mt-2 flex flex-col gap-2">
                <button className="btn-ghost" onClick={() => go({ name: 'customer', id: dup.id })}>Use existing customer</button>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={dupOk} onChange={(e) => setDupOk(e.target.checked)} />
                  Create a separate customer anyway
                </label>
              </div>
            </div>
          )}
          <input className="input" inputMode="decimal" placeholder="Opening balance ₹ (optional)" value={opening} onChange={(e) => setOpening(e.target.value)} />
          <input className="input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {err && <p className="text-sm text-red-700">{err}</p>}
          <button className="btn-primary" onClick={save}>Save customer</button>
        </div>
      )}

      {list.length === 0 && <p className="text-center text-slate-500">No customers found.</p>}
      {list.map((c) => (
        <button key={c.id} onClick={() => go({ name: 'customer', id: c.id })} className="card flex items-center justify-between text-left">
          <span><b>{c.name}</b><br /><span className="text-sm text-slate-500">{c.phone}</span></span>
          <span className={`text-lg font-bold ${(bal.get(c.id) ?? 0) > 0 ? 'text-red-700' : 'text-slate-700'}`}>{formatINR(bal.get(c.id) ?? 0)}</span>
        </button>
      ))}
      <button className="text-sm text-teal-800 underline" onClick={() => setShowInactive(!showInactive)}>
        {showInactive ? 'Show active customers' : 'Show inactive customers'}
      </button>
    </div>
  )
}
