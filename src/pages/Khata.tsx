import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { updateCustomer } from '../lib/db'
import { balanceOf } from '../lib/ledger'
import { formatINR } from '../lib/money'
import { entryLabel, formatWhen } from '../lib/labels'
import GoodsEntry from '../components/GoodsEntry'
import PaymentBox from '../components/PaymentBox'
import type { View } from '../App'
import { useLang } from '../lib/langContext'

export default function Khata({ id, go }: { id: string; go: (v: View) => void }) {
  const { shopId, customers, entries } = useStore()
  const { t, lang } = useLang()
  const c = customers.find((x) => x.id === id)
  const mine = entries.filter((e) => e.customerId === id).sort((a, b) => b.occurredAt - a.occurredAt)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')

  if (!c) return <p className="text-slate-500">{t('loading')}</p>

  return (
    <div className="flex flex-col gap-4">
      <button className="self-start text-lg text-teal-800 underline" onClick={() => go({ name: 'customers' })}>{t('backCustomers')}</button>
      <div className="card">
        <h1 className="text-3xl font-bold">{c.name} {!c.isActive && <span className="text-base text-slate-500">{t('inactiveTag')}</span>}</h1>
        {c.phone && <p className="text-slate-500">{c.phone}</p>}
        <p className="mt-2 text-lg text-slate-600">{t('amountOwed')}</p>
        <p className="text-5xl font-bold text-red-700">{formatINR(balanceOf(mine))}</p>
      </div>

      <GoodsEntry customerId={id} customerName={c.name} />
      <PaymentBox customerId={id} customerName={c.name} />

      <div className="card">
        <h2 className="mb-2 text-xl font-bold">{t('pastEntries')}</h2>
        {mine.length === 0 && <p className="text-slate-500">{t('nothing')}</p>}
        {mine.map((e) => (
          <button key={e.id} onClick={() => go({ name: 'txn', id: e.id })}
            className="flex w-full items-center justify-between border-b border-slate-100 py-3 text-left last:border-0">
            <span><b>{entryLabel(e, t)}{e.pending && ' ⏳'}</b><br /><span className="text-sm text-slate-500">{formatWhen(e.occurredAt, lang)}</span></span>
            <span className={`text-lg font-bold ${e.sign === 1 ? 'text-red-700' : 'text-teal-700'}`}>{e.sign === 1 ? '+' : '−'}{formatINR(e.amountPaise)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {renaming ? (
          <div className="card flex flex-col gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary" onClick={() => { if (name.trim()) { updateCustomer(shopId, c.id, { name: name.trim() }); setRenaming(false) } }}>{t('saveName')}</button>
          </div>
        ) : (
          <button className="text-teal-800 underline" onClick={() => { setName(c.name); setRenaming(true) }}>{t('changeName')}</button>
        )}
        <button className="text-teal-800 underline" onClick={() => updateCustomer(shopId, c.id, { isActive: !c.isActive })}>
          {c.isActive ? t('hide') : t('restore')}
        </button>
      </div>
    </div>
  )
}
