import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { useLang } from '../lib/langContext'
import { updateCustomer } from '../lib/db'
import { prepareShare, waDigits, waLink } from '../lib/bill'
import { displayName } from '../lib/names'
import { WALK_IN_ID } from '../lib/walkin'
import type { Lang } from '../lib/i18n'
import type { Customer, Entry } from '../lib/types'

export default function BillShare({ bill, customer, onClose }: { bill: Entry; customer: Customer; onClose: () => void }) {
  const { shopId, shop, entries } = useStore()
  const { t, lang: appLang } = useLang()
  const walkIn = customer.id === WALK_IN_ID
  const [billLang, setBillLang] = useState<Lang>(appLang)
  const [phone, setPhone] = useState(walkIn ? '' : customer.phone)
  const [savePhone, setSavePhone] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  // Balance after this bill: everything up to this bill's time (include the bill itself if not yet in the list).
  const upTo = entries.filter((e) => e.customerId === bill.customerId && e.occurredAt <= bill.occurredAt)
  let balance = upTo.reduce((s, e) => s + e.sign * e.amountPaise, 0)
  if (!entries.some((e) => e.id === bill.id)) balance += bill.amountPaise - (bill.settledBy ? bill.amountPaise : 0)

  const { text, tooLong } = prepareShare({
    shopName: shop.name,
    shopPhone: shop.phone,
    bill,
    customerName: displayName(customer, billLang),
    balanceAfterPaise: balance,
    lang: billLang,
  })

  function send() {
    const digits = waDigits(phone)
    if (!digits) return setErr(t('errPhone'))
    setErr('')
    if (savePhone && !walkIn && !customer.phone) updateCustomer(shopId, customer.id, { phone: phone.trim() })
    window.open(waLink(digits, text), '_blank', 'noopener')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy:', text)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="text-2xl font-bold">{t('shareTitle')}</h2>

        <label className="text-sm text-slate-600">{t('phoneLabel')}</label>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-3 text-lg font-semibold">+91</span>
          <input className="input text-xl" inputMode="tel" placeholder={t('phonePh')} value={phone}
            onChange={(e) => { setPhone(e.target.value); setErr('') }} />
        </div>
        {!walkIn && !customer.phone && (
          <label className="flex items-center gap-2 text-base">
            <input type="checkbox" className="h-5 w-5" checked={savePhone} onChange={(e) => setSavePhone(e.target.checked)} />
            {t('savePhone', { name: displayName(customer, appLang) })}
          </label>
        )}
        {err && <p className="text-red-700">{err}</p>}

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{t('billLang')}:</span>
          {(['en', 'te'] as const).map((l) => (
            <button key={l} onClick={() => setBillLang(l)} className={`rounded-full px-3 py-1 font-semibold ${billLang === l ? 'bg-teal-700 text-white' : 'bg-slate-200'}`}>
              {l === 'en' ? 'English' : 'తెలుగు'}
            </button>
          ))}
        </div>

        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm">{text}</pre>
        {tooLong && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">{t('billTooLong')}</p>}

        <button className="btn-primary text-lg" onClick={send} disabled={tooLong}>{t('sendWhatsApp')}</button>
        <p className="-mt-1 text-center text-sm text-slate-500">{t('sendFailedHint')}</p>
        <button className="btn-ghost" onClick={copy}>{copied ? t('copied') : t('copyBill')}</button>
        <button className="btn-ghost" onClick={onClose}>{t('close')}</button>
      </div>
    </div>
  )
}
