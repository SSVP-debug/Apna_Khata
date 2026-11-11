import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { customerStats, isPaidUp } from '../lib/ledger'
import { formatINR } from '../lib/money'
import { formatDay } from '../lib/labels'
import { allNames, displayName } from '../lib/names'
import { useLang } from '../lib/langContext'
import AddCustomer from '../components/AddCustomer'
import { WALK_IN_ID } from '../lib/walkin'
import type { View } from '../App'

export type CustomerFilter = 'owing' | 'paid' | 'all'

export default function Customers({ go, initialFilter = 'all' }: { go: (v: View) => void; initialFilter?: CustomerFilter }) {
  const { customers, entries } = useStore()
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<CustomerFilter>(initialFilter)
  const [adding, setAdding] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const stats = customerStats(entries)
  const bal = (id: string) => stats.get(id)?.balance ?? 0

  const visible = customers.filter((c) => c.id !== WALK_IN_ID && c.isActive !== showInactive)
  const counts = {
    owing: visible.filter((c) => bal(c.id) > 0).length,
    paid: visible.filter((c) => isPaidUp(stats.get(c.id))).length,
    all: visible.length,
  }

  const list = visible
    .filter((c) => (filter === 'owing' ? bal(c.id) > 0 : filter === 'paid' ? isPaidUp(stats.get(c.id)) : true))
    .filter((c) => !q.trim() || allNames(c).some((n) => n.includes(q.trim().toLowerCase())) || (c.phone && c.phone.includes(q.trim())))
    .sort((a, b) =>
      filter === 'paid'
        ? (stats.get(b.id)?.lastPaymentAt ?? 0) - (stats.get(a.id)?.lastPaymentAt ?? 0)
        : bal(b.id) - bal(a.id) || displayName(a, lang).localeCompare(displayName(b, lang)),
    )

  const chips: { key: CustomerFilter; label: string }[] = [
    { key: 'owing', label: t('filterOwing') },
    { key: 'paid', label: t('filterPaid') },
    { key: 'all', label: t('filterAll') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">{t('customersTitle')}</h1>
      <div className="grid grid-cols-3 gap-2">
        {chips.map((c) => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            className={`rounded-lg px-2 py-3 text-base font-semibold active:scale-95 ${filter === c.key ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
            {c.label} ({counts[c.key]})
          </button>
        ))}
      </div>
      <input className="input" placeholder={t('searchCustomer')} value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="py-6 text-center text-lg text-slate-500">{t('noCustomers')}</p>}
      {list.map((c) => {
        const s = stats.get(c.id)
        const b = s?.balance ?? 0
        const paid = isPaidUp(s)
        return (
          <button key={c.id} onClick={() => go({ name: 'customer', id: c.id })} className="card flex items-center justify-between gap-2 text-left">
            <span>
              <span className="text-xl font-semibold">{displayName(c, lang)}</span>
              {paid && (
                <span className="mt-1 block text-sm">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">{b < 0 ? t('advance') : t('paidInFull')}</span>
                  {s?.lastPaymentAt && <span className="ml-2 text-slate-500">{t('lastPayment', { date: formatDay(s.lastPaymentAt, lang) })}</span>}
                </span>
              )}
            </span>
            <span className={`text-xl font-bold ${b > 0 ? 'text-red-700' : paid ? 'text-green-700' : 'text-slate-600'}`}>{formatINR(b)}</span>
          </button>
        )
      })}
      <button className="btn-primary" onClick={() => setAdding(true)}>{t('addCustomerBtn')}</button>
      <button className="text-sm text-teal-800 underline" onClick={() => setShowInactive(!showInactive)}>
        {showInactive ? t('showActive') : t('showInactive')}
      </button>
      {adding && <AddCustomer onClose={() => setAdding(false)} go={go} />}
    </div>
  )
}
