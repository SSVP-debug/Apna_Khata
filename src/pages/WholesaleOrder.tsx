import { useEffect, useState } from 'react'
import type { View } from '../App'
import MicButton from '../components/MicButton'
import { useLang } from '../lib/langContext'
import { parseItems } from '../lib/parseItems'
import { useStore } from '../lib/storeContext'
import { buildWholesaleOrderMessage, normalizeIndianWhatsAppNumber, type WholesaleOrderItem } from '../lib/wholesaleOrder'

interface DraftItem { id: string; name: string; qty: string; unit: string }
interface Draft { phone: string; items: DraftItem[] }
const newItem = (): DraftItem => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: '', qty: '1', unit: '' })

export default function WholesaleOrder({ go }: { go: (v: View) => void }) {
  const { shopId, shop, products } = useStore()
  const { t, lang } = useLang()
  const storageKey = `apna-khata-wholesale-order:${shopId}`
  function readDraft(): Draft {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return { phone: '', items: [] }
      const draft = JSON.parse(raw) as Partial<Draft>
      return {
        phone: typeof draft.phone === 'string' ? draft.phone : '',
        items: Array.isArray(draft.items) ? draft.items.filter((item): item is DraftItem =>
          !!item && typeof item.id === 'string' && typeof item.name === 'string'
          && typeof item.qty === 'string' && typeof item.unit === 'string') : [],
      }
    } catch {
      // Ignore an unreadable local draft and keep the order form available.
      return { phone: '', items: [] }
    }
  }

  const [initialDraft] = useState(readDraft)
  const [phone, setPhone] = useState(initialDraft.phone)
  const [items, setItems] = useState<DraftItem[]>(initialDraft.items)
  const [error, setError] = useState('')

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ phone, items } satisfies Draft)) } catch {
      // The order remains usable if browser storage is unavailable.
    }
  }, [storageKey, phone, items])

  function addSpokenGoods(text: string) {
    const parsed = parseItems(text)
    if (!parsed.length) { setError(t('errUnderstand')); return }
    setError('')
    setItems((current) => [...current, ...parsed.map((item) => ({ ...newItem(), name: item.name, qty: String(item.qty), unit: item.unit }))])
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  function sendOrder() {
    if (!items.length) { setError(t('wholesaleNeedItems')); return }
    const validItems: WholesaleOrderItem[] = []
    for (const item of items) {
      const qty = Number(item.qty)
      if (!item.name.trim()) { setError(t('errNeedName')); return }
      if (!Number.isFinite(qty) || qty <= 0) { setError(t('wholesaleQtyError')); return }
      validItems.push({ name: item.name.trim(), qty, unit: item.unit.trim() || 'pcs' })
    }
    const number = normalizeIndianWhatsAppNumber(phone)
    if (!number) { setError(t('wholesaleNumberError')); return }
    const date = new Intl.DateTimeFormat(lang === 'te' ? 'te-IN' : 'en-IN', { dateStyle: 'medium' }).format(new Date())
    const message = buildWholesaleOrderMessage(shop.name, date, validItems)
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setError('')
  }

  const frequent = [...products].sort((a, b) => b.uses - a.uses || b.updatedAt - a.updatedAt).slice(0, 10)
  return (
    <div className="flex flex-col gap-4">
      <button className="self-start text-base font-semibold text-teal-800 underline" onClick={() => go({ name: 'home' })}>{t('wholesaleBack')}</button>
      <section className="card flex flex-col gap-3">
        <div><h1 className="text-2xl font-bold">{t('wholesaleTitle')}</h1><p className="mt-1 text-sm text-slate-600">{t('wholesaleIntro')}</p></div>
        <div>
          <label className="mb-1 block font-semibold" htmlFor="wholesale-phone">{t('wholesaleNumber')}</label>
          <input id="wholesale-phone" className="input text-lg" type="tel" inputMode="tel" autoComplete="tel"
            placeholder={t('wholesaleNumberPh')} value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
      </section>
      <section className="card flex flex-col gap-3">
        <h2 className="text-xl font-bold">{t('wholesaleItems')}</h2>
        <MicButton hint={t('wholesaleVoiceHint')} onText={addSpokenGoods} />
        {frequent.length > 0 && <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">{t('wholesaleFrequent')}</p>
          <div className="flex flex-wrap gap-2">{frequent.map((product) =>
            <button key={product.id} type="button" className="rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 active:scale-95"
              onClick={() => { setItems((current) => [...current, { ...newItem(), name: product.name, unit: product.unit }]); setError('') }}>+ {product.name}</button>)}</div>
        </div>}
        {items.length === 0 && <p className="py-2 text-center text-slate-500">{t('wholesaleEmpty')}</p>}
        {items.map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between"><span className="font-semibold text-slate-500">{index + 1}</span>
            <button type="button" className="text-sm font-semibold text-red-700 underline" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>{t('wholesaleRemove')}</button></div>
          <label className="mb-1 block text-sm text-slate-600">{t('wholesaleItemName')}</label>
          <input className="input mb-2" value={item.name} placeholder={t('itemPh')} onChange={(event) => updateItem(item.id, { name: event.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="mb-1 block text-sm text-slate-600">{t('wholesaleQty')}</label>
              <input className="input" inputMode="decimal" type="number" min="0.01" step="any" value={item.qty} onChange={(event) => updateItem(item.id, { qty: event.target.value })} /></div>
            <div><label className="mb-1 block text-sm text-slate-600">{t('wholesaleUnit')}</label>
              <input className="input" value={item.unit} placeholder="kg, bag, box…" onChange={(event) => updateItem(item.id, { unit: event.target.value })} /></div>
          </div>
        </div>)}
        <button type="button" className="btn-ghost" onClick={() => setItems((current) => [...current, newItem()])}>{t('wholesaleAddItem')}</button>
      </section>
      <section className="card flex flex-col gap-3">
        <p className="text-sm text-slate-600">{t('wholesaleDraftSaved')}</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <button type="button" className="btn-primary py-4 text-lg" onClick={sendOrder}>{t('wholesaleSend')}</button>
        <button type="button" className="btn-ghost" onClick={() => { if (window.confirm(t('wholesaleClear'))) { setItems([]); setPhone(''); setError('') } }}>{t('wholesaleClear')}</button>
      </section>
    </div>
  )
}
