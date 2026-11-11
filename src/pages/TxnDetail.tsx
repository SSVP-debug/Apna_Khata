import { useStore } from '../lib/storeContext'
import { useState } from 'react'
import { reverseEntry, reverseSale } from '../lib/db'
import { findCustomer } from '../lib/walkin'
import BillShare from '../components/BillShare'
import { formatINR } from '../lib/money'
import { entryLabel, formatWhen } from '../lib/labels'
import type { View } from '../App'
import { useLang } from '../lib/langContext'
import { displayName } from '../lib/names'

export default function TxnDetail({ id, go }: { id: string; go: (v: View) => void }) {
  const { shopId, uid, entries, customers } = useStore()
  const { t, lang } = useLang()
  const [sharing, setSharing] = useState(false)
  const e = entries.find((x) => x.id === id)
  if (!e) return <p className="text-slate-500">{t('loading')}</p>
  const c = findCustomer(customers, e.customerId)
  // A sale paid on the spot is a bill + its payment; they are shown, shared and cancelled together.
  const bill = e.type === 'payment' && e.billId ? (entries.find((x) => x.id === e.billId) ?? e) : e
  const salePayment = bill.settledBy ? entries.find((x) => x.type === 'payment' && x.billId === bill.id) : undefined
  const cancelled = entries.some((x) => x.reverses === e.id || x.reverses === bill.id)
  const canCancel = (bill.type === 'bill' || bill.type === 'payment') && !cancelled
  const canShare = bill.type === 'bill' && !!bill.items?.length && !cancelled

  return (
    <div className="flex flex-col gap-4">
      <button className="self-start text-lg text-teal-800 underline" onClick={() => go({ name: 'customer', id: e.customerId })}>← {c ? displayName(c, lang) : t('loading')}</button>
      <div className="card">
        <p className="text-lg text-slate-600">{entryLabel(e, t)}</p>
        <p className="text-4xl font-bold">{formatINR(e.amountPaise)}</p>
        <p className="mt-1 text-lg">{c ? displayName(c, lang) : ''}</p>
        <p className="text-slate-500">{formatWhen(e.occurredAt, lang)}{e.method && ` · ${e.method}`}</p>
        <p className="mt-1">{e.pending ? t('waitingSync') : t('synced')}</p>
        {cancelled && <p className="mt-1 font-semibold text-amber-700">{t('txnCancelled')}</p>}
        {e.description && <p className="mt-1 text-slate-600">{e.description}</p>}
      </div>
      {e.items && e.items.length > 0 && (
        <div className="card">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-2 border-b pb-1 text-sm font-bold text-slate-600">
            <span>{t('colItem')}</span><span>{t('colQty')}</span><span className="text-right">{t('colAmount')}</span>
          </div>
          {e.items.map((i, k) => (
            <div key={k} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-2 border-b border-slate-100 py-2 last:border-0">
              <span className="font-semibold">{i.name}</span><span>{i.qty} {i.unit}</span>
              <span className="text-right font-semibold">{formatINR(i.lineTotalPaise)}</span>
            </div>
          ))}
        </div>
      )}
      {canShare && c && (
        <>
          <button className="btn-primary text-lg" onClick={() => setSharing(true)}>📲 {t('shareBill')}</button>
          {sharing && <BillShare bill={bill} customer={c} onClose={() => setSharing(false)} />}
        </>
      )}
      {canCancel && (
        <button className="btn-ghost text-red-700" onClick={() => {
          if (confirm(t('cancelConfirm', { label: entryLabel(bill, t), amt: formatINR(bill.amountPaise) }))) {
            if (bill.settledBy) reverseSale(shopId, uid, bill, salePayment)
            else reverseEntry(shopId, uid, bill)
            go({ name: 'customer', id: e.customerId })
          }
        }}>{t('cancelEntry')}</button>
      )}
    </div>
  )
}
