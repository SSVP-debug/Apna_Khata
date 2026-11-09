import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addEntry } from '../lib/db'
import { formatINR, parseRupees } from '../lib/money'
import { useLang } from '../lib/langContext'

export default function PaymentBox({ customerId, customerName }: { customerId: string; customerName: string }) {
  const { shopId, uid, online } = useStore()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [msg, setMsg] = useState('')

  function save() {
    const p = parseRupees(amount)
    if (!p) return setMsg(t('errValidAmount'))
    if (!confirm(t('confirmPay', { amt: formatINR(p), name: customerName }))) return
    addEntry(shopId, uid, { customerId, type: 'payment', amountPaise: p, method })
    setMsg(t('paySuccess', { amt: formatINR(p), name: customerName }) + (online ? '' : ' ' + t('savedOffline')))
    setAmount('')
    setOpen(false)
  }

  return (
    <div className="card flex flex-col gap-3">
      {msg && <p className="rounded-lg bg-green-100 p-3 font-semibold text-green-800">✓ {msg}</p>}
      {!open ? (
        <button className="btn-ghost text-lg" onClick={() => { setOpen(true); setMsg('') }}>{t('paymentReceived')}</button>
      ) : (
        <>
          <h2 className="text-xl font-bold">{t('paymentReceived')}</h2>
          <input className="input text-2xl font-bold" inputMode="decimal" placeholder={t('amountPh')} autoFocus value={amount}
            onChange={(e) => setAmount(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            {[['cash', t('cash')], ['upi', t('upi')], ['other', t('other')]].map(([v, l]) => (
              <button key={v} className={method === v ? 'btn-primary' : 'btn-ghost'} onClick={() => setMethod(v)}>{l}</button>
            ))}
          </div>
          {msg && <p className="text-red-700">{msg}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={save}>{t('savePayment')}</button>
          </div>
        </>
      )}
    </div>
  )
}
