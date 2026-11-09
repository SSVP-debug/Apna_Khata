import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addEntry } from '../lib/db'
import { formatINR, lineTotal, parseRupees } from '../lib/money'
import { balancesByCustomer } from '../lib/ledger'
import type { Item } from '../lib/types'

interface Row { name: string; qty: string; unit: string; price: string }
const emptyRow: Row = { name: '', qty: '1', unit: 'kg', price: '' }

export default function EntryForm({
  type,
  presetCustomerId,
  onDone,
}: {
  type: 'bill' | 'payment'
  presetCustomerId?: string
  onDone: () => void
}) {
  const { shopId, uid, customers, entries } = useStore()
  const [customerId, setCustomerId] = useState(presetCustomerId ?? '')
  const [mode, setMode] = useState<'quick' | 'itemized'>('quick')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [method, setMethod] = useState('cash')
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }])
  const [confirming, setConfirming] = useState(false)
  const [err, setErr] = useState('')

  const balances = balancesByCustomer(entries)
  const active = customers.filter((c) => c.isActive).sort((a, b) => a.name.localeCompare(b.name))

  const items: Item[] = rows
    .filter((r) => r.name.trim() || r.price)
    .map((r) => {
      const qty = Number(r.qty)
      const unitPricePaise = parseRupees(r.price) ?? 0
      return {
        name: r.name.trim(), qty, unit: r.unit.trim() || 'pcs', unitPricePaise,
        lineTotalPaise: Number.isFinite(qty) && qty > 0 ? lineTotal(qty, unitPricePaise) : 0,
      }
    })
  const itemsTotal = items.reduce((s, i) => s + i.lineTotalPaise, 0)
  const amountPaise = type === 'bill' && mode === 'itemized' ? itemsTotal : parseRupees(amount)

  function validate(): string {
    if (!customerId) return 'Select a customer'
    if (type === 'bill' && mode === 'itemized') {
      if (!items.length) return 'Add at least one item'
      if (items.some((i) => !i.name || !(i.qty > 0) || i.unitPricePaise <= 0 || i.lineTotalPaise <= 0))
        return 'Each item needs a name, quantity > 0 and a price > 0'
    }
    if (!amountPaise || amountPaise <= 0) return 'Enter a valid amount (e.g. 250 or 250.50)'
    return ''
  }

  function save() {
    addEntry(shopId, uid, {
      customerId,
      type,
      amountPaise: amountPaise!,
      description: desc,
      method: type === 'payment' ? method : undefined,
      mode: type === 'bill' ? mode : undefined,
      items: type === 'bill' && mode === 'itemized' ? items : undefined,
    })
    onDone()
  }

  const customer = customers.find((c) => c.id === customerId)
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  if (confirming && amountPaise) {
    return (
      <div className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">Confirm {type === 'bill' ? 'bill' : 'payment'}</h2>
        <p><b>{customer?.name}</b></p>
        <p className="text-3xl font-bold">{formatINR(amountPaise)}</p>
        {desc && <p className="text-slate-600">{desc}</p>}
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setConfirming(false)}>Edit</button>
          <button className="btn-primary flex-1" onClick={save}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-lg font-bold">{type === 'bill' ? 'New credit bill' : 'Receive payment'}</h2>
      <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Select customer…</option>
        {active.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.phone && `(${c.phone})`} — {formatINR(balances.get(c.id) ?? 0)}
          </option>
        ))}
      </select>

      {type === 'bill' && (
        <div className="flex gap-2">
          {(['quick', 'itemized'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={mode === m ? 'btn-primary flex-1' : 'btn-ghost flex-1'}>
              {m === 'quick' ? 'Quick total' : 'Itemized'}
            </button>
          ))}
        </div>
      )}

      {type === 'bill' && mode === 'itemized' ? (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-1">
              <input className="input col-span-12" placeholder="Product" value={r.name}
                onChange={(e) => setRow(i, { name: e.target.value })} />
              <input className="input col-span-3" inputMode="decimal" placeholder="Qty" value={r.qty}
                onChange={(e) => setRow(i, { qty: e.target.value })} />
              <input className="input col-span-3" placeholder="Unit" value={r.unit}
                onChange={(e) => setRow(i, { unit: e.target.value })} />
              <input className="input col-span-4" inputMode="decimal" placeholder="₹ price" value={r.price}
                onChange={(e) => setRow(i, { price: e.target.value })} />
              <button type="button" className="btn-ghost col-span-2 px-0"
                onClick={() => setRows(rows.length > 1 ? rows.filter((_, x) => x !== i) : [{ ...emptyRow }])}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setRows([...rows, { ...emptyRow }])}>+ Add item</button>
          <p className="text-right text-xl font-bold">Total {formatINR(itemsTotal)}</p>
        </div>
      ) : (
        <input className="input text-2xl font-bold" inputMode="decimal" placeholder="Amount ₹" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
      )}

      {type === 'payment' && (
        <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank transfer</option>
          <option value="other">Other</option>
        </select>
      )}
      <input className="input" placeholder={type === 'bill' ? 'Description (optional)' : 'Note (optional)'}
        value={desc} onChange={(e) => setDesc(e.target.value)} />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary" onClick={() => {
        const v = validate()
        setErr(v)
        if (!v) setConfirming(true)
      }}>Review</button>
    </div>
  )
}
