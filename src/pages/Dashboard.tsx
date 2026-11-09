import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { balancesByCustomer } from '../lib/ledger'
import { formatINR } from '../lib/money'
import { entryLabel, formatWhen } from '../lib/labels'
import AddCustomer from '../components/AddCustomer'
import type { View } from '../App'
import { useLang } from '../lib/langContext'

export default function Dashboard({ go }: { go: (v: View) => void }) {
  const { entries, customers, pending, online } = useStore()
  const { t, lang } = useLang()
  const [adding, setAdding] = useState(false)
  const bal = balancesByCustomer(entries)
  const owing = [...bal.values()].filter((v) => v > 0)
  const totalOwed = owing.reduce((s, v) => s + v, 0)
  const recent = [...entries].sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 8)
  const name = (id: string) => customers.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="flex flex-col gap-4">
      <button className="card text-left" onClick={() => go({ name: 'customers', owingOnly: true })}>
        <p className="text-lg text-slate-600">{t('owingCount')}</p>
        <p className="text-5xl font-bold">{owing.length}</p>
        <p className="text-sm text-teal-800 underline">{t('tapList')}</p>
      </button>
      <div className="card">
        <p className="text-lg text-slate-600">{t('totalOwed')}</p>
        <p className="text-5xl font-bold text-red-700">{formatINR(totalOwed)}</p>
      </div>
      <button className="btn-primary py-5 text-2xl" onClick={() => setAdding(true)}>{t('addCustomerBtn')}</button>

      <div className="card">
        <h2 className="mb-2 text-xl font-bold">{t('recent')}</h2>
        {recent.length === 0 && <p className="text-slate-500">{t('noActivity')}</p>}
        {recent.map((e) => (
          <button key={e.id} onClick={() => go({ name: 'txn', id: e.id })}
            className="flex w-full items-center justify-between border-b border-slate-100 py-3 text-left last:border-0">
            <span>
              <b className="text-lg">{name(e.customerId)}</b>
              <br /><span className="text-slate-600">{entryLabel(e, t)}{e.pending && ' ⏳'}</span>
              <br /><span className="text-sm text-slate-500">{formatWhen(e.occurredAt, lang)}</span>
            </span>
            <span className={`text-xl font-bold ${e.sign === 1 ? 'text-red-700' : 'text-teal-700'}`}>{formatINR(e.amountPaise)}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <p className="text-slate-600">{t('syncStatus')}</p>
        <p className="text-xl font-bold">
          {!online ? (pending ? t('offlineWaiting', { n: pending }) : t('offline')) : pending ? t('waiting', { n: pending }) : t('allSynced')}
        </p>
      </div>
      {adding && <AddCustomer onClose={() => setAdding(false)} go={go} />}
    </div>
  )
}
