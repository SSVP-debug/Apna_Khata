import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { balancesByCustomer } from '../lib/ledger'
import { formatINR } from '../lib/money'
import AddCustomer from '../components/AddCustomer'
import type { View } from '../App'
import { useLang } from '../lib/langContext'

export default function Customers({ go, owingOnly }: { go: (v: View) => void; owingOnly?: boolean }) {
  const { customers, entries } = useStore()
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const bal = balancesByCustomer(entries)

  const list = customers
    .filter((c) => (owingOnly ? (bal.get(c.id) ?? 0) > 0 : c.isActive !== showInactive))
    .filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()) || (c.phone && c.phone.includes(q.trim())))
    .sort((a, b) => (bal.get(b.id) ?? 0) - (bal.get(a.id) ?? 0) || a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">{owingOnly ? t('customersOwe') : t('customersTitle')}</h1>
      <input className="input" placeholder={t('searchCustomer')} value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="py-6 text-center text-lg text-slate-500">{t('noCustomers')}</p>}
      {list.map((c) => {
        const b = bal.get(c.id) ?? 0
        return (
          <button key={c.id} onClick={() => go({ name: 'customer', id: c.id })} className="card flex items-center justify-between text-left">
            <span className="text-xl font-semibold">{c.name}</span>
            <span className={`text-xl font-bold ${b > 0 ? 'text-red-700' : 'text-slate-600'}`}>{formatINR(b)}</span>
          </button>
        )
      })}
      {!owingOnly && (
        <>
          <button className="btn-primary" onClick={() => setAdding(true)}>{t('addCustomerBtn')}</button>
          <button className="text-sm text-teal-800 underline" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? t('showActive') : t('showInactive')}
          </button>
        </>
      )}
      {owingOnly && <button className="btn-ghost" onClick={() => go({ name: 'customers' })}>{t('showAll')}</button>}
      {adding && <AddCustomer onClose={() => setAdding(false)} go={go} />}
    </div>
  )
}
