import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { useLang } from '../lib/langContext'
import { deleteProduct, saveProduct } from '../lib/db'
import { formatINR, parseRupees } from '../lib/money'
import type { Product } from '../lib/products'
import type { View } from '../App'

const textOf = (p: number) => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2))

function Editor({ initial, onDone }: { initial: Product | null; onDone: () => void }) {
  const { shopId } = useStore()
  const { t } = useLang()
  const [name, setName] = useState(initial?.name ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? 'kg')
  const [price, setPrice] = useState(initial ? textOf(initial.unitPricePaise) : '')
  const [err, setErr] = useState('')

  function save() {
    const p = parseRupees(price)
    if (!name.trim() || !p) return setErr(t('errProduct'))
    saveProduct(shopId, initial, { name, unit: unit.trim() || 'pcs', unitPricePaise: p })
    onDone()
  }

  return (
    <div className="card flex flex-col gap-2">
      <input className="input" placeholder={t('itemName')} value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder={t('unitPh')} value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input className="input" inputMode="decimal" placeholder={t('pricePerUnit')} value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      {err && <p className="text-red-700">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={onDone}>{t('cancel')}</button>
        <button className="btn-primary" onClick={save}>{t('save')}</button>
      </div>
    </div>
  )
}

export default function Products({ go }: { go: (v: View) => void }) {
  const { shopId, products } = useStore()
  const { t } = useLang()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-3">
      <button className="self-start text-lg text-teal-800 underline" onClick={() => go({ name: 'settings' })}>{t('backSettings')}</button>
      <h1 className="text-2xl font-bold">{t('productsTitle')}</h1>
      <p className="text-slate-600">{t('productsHelp')}</p>
      {editing === 'new' ? (
        <Editor initial={null} onDone={() => setEditing(null)} />
      ) : (
        <button className="btn-primary" onClick={() => setEditing('new')}>{t('addProduct')}</button>
      )}
      {sorted.length === 0 && <p className="py-4 text-center text-slate-500">{t('noProducts')}</p>}
      {sorted.map((p) =>
        editing === p.id ? (
          <Editor key={p.id} initial={p} onDone={() => setEditing(null)} />
        ) : (
          <div key={p.id} className="card flex items-center justify-between gap-2">
            <span className="text-lg font-semibold">{p.name}<br />
              <span className="text-base font-normal text-slate-600">{formatINR(p.unitPricePaise)}{t('perUnit', { unit: p.unit })}</span>
            </span>
            <span className="flex gap-2">
              <button className="btn-ghost px-3 py-2" onClick={() => setEditing(p.id)}>{t('edit')}</button>
              <button className="btn-ghost px-3 py-2 text-red-700"
                onClick={() => { if (confirm(t('deleteConfirm', { name: p.name }))) deleteProduct(shopId, p.id) }}>{t('deleteBtn')}</button>
            </span>
          </div>
        ),
      )}
    </div>
  )
}
