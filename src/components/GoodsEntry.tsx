import { useRef, useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addEntry, newId } from '../lib/db'
import { formatINR, parseRupees } from '../lib/money'
import { parseItems, type ParsedItem } from '../lib/parseItems'
import type { Item } from '../lib/types'
import MicButton from './MicButton'
import { useLang } from '../lib/langContext'
import { getVoiceLang } from '../lib/settings'

interface Row {
  key: string
  name: string
  qtyText: string
  unit: string
  unitPricePaise: number // may be fractional; amount = qty x unit price
  amountText: string
}

const textOf = (p: number) => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2))
const qtyOf = (r: Row) => {
  const q = Number(r.qtyText)
  return Number.isFinite(q) && q > 0 ? q : 0
}

function fromParsed(p: ParsedItem): Row {
  const unitPricePaise = p.amountPaise ? p.amountPaise / p.qty : 0
  return { key: newId(), name: p.name, qtyText: String(p.qty), unit: p.unit, unitPricePaise, amountText: p.amountPaise ? textOf(p.amountPaise) : '' }
}
const blank = (): Row => ({ key: newId(), name: '', qtyText: '1', unit: '', unitPricePaise: 0, amountText: '' })

export default function GoodsEntry({ customerId, customerName }: { customerId: string; customerName: string }) {
  const { shopId, uid } = useStore()
  const { t } = useLang()
  const [rows, setRows] = useState<Row[]>([])
  const [typed, setTyped] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  const tableRef = useRef<HTMLDivElement>(null)

  const patch = (key: string, f: (r: Row) => Row) => setRows((rs) => rs.map((r) => (r.key === key ? f(r) : r)))

  function withQty(r: Row, qtyText: string): Row {
    let up = r.unitPricePaise
    const old = qtyOf(r)
    if (!up) {
      const a = parseRupees(r.amountText)
      if (a && old > 0) up = a / old
    }
    const q = Number(qtyText)
    const next = { ...r, qtyText, unitPricePaise: up }
    if (up > 0 && Number.isFinite(q)) next.amountText = q > 0 ? textOf(Math.round(q * up)) : '0'
    return next
  }

  function step(r: Row, dir: 1 | -1): Row {
    const q = Math.max(0, Math.round((qtyOf(r) + dir) * 100) / 100)
    return withQty(r, String(q))
  }

  function setAmount(r: Row, amountText: string): Row {
    const a = parseRupees(amountText)
    const q = qtyOf(r)
    return { ...r, amountText, unitPricePaise: a && q > 0 ? a / q : r.unitPricePaise }
  }

  function addFromText(text: string) {
    const parsed = parseItems(text)
    if (!parsed.length) return setErr(t('errUnderstand'))
    setErr('')
    setDone('')
    setRows((rs) => [...rs, ...parsed.map(fromParsed)])
  }

  const lines = rows.map((r) => parseRupees(r.amountText))
  const total = lines.reduce<number>((s, a) => s + (a ?? 0), 0)

  function confirmAdd() {
    setDone('')
    if (!rows.length) return setErr(t('errAddOne'))
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.name.trim()) return setErr(t('errNeedName'))
      if (qtyOf(r) <= 0) return setErr(t('errQtyZero', { name: r.name }))
      if (!lines[i]) return setErr(t('errNeedAmount', { name: r.name }))
    }
    const items: Item[] = rows.map((r, i) => ({
      name: r.name.trim(), qty: qtyOf(r), unit: r.unit.trim() || 'pcs',
      unitPricePaise: Math.round(lines[i]! / qtyOf(r)), lineTotalPaise: lines[i]!,
    }))
    addEntry(shopId, uid, { customerId, type: 'bill', mode: 'itemized', amountPaise: total, items })
    setDone(t('goodsSuccess', { amt: formatINR(total), name: customerName }))
    setRows([])
    setErr('')
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t('addGoods')}</h2>
      {done && <p className="rounded-lg bg-green-100 p-3 text-lg font-semibold text-green-800">✓ {done}</p>}

      <MicButton hint={t('tapAllGoods')} onText={addFromText} />

      <div className="flex flex-col gap-2">
        <textarea className="input min-h-24 text-lg" rows={3} lang={getVoiceLang()} placeholder={t('typePh')} value={typed}
          onChange={(e) => setTyped(e.target.value)} />
        <p className="text-sm text-slate-500">{t('keyboardHint')}</p>
        <button className="btn-primary" onClick={() => { addFromText(typed); setTyped('') }}>{t('add')}</button>
      </div>

      <div ref={tableRef} className="flex flex-col gap-2">
        <div className="grid grid-cols-[1.1fr_1.4fr_0.9fr] gap-2 border-b pb-1 text-sm font-bold text-slate-600">
          <span>{t('colItem')}</span><span className="text-center">{t('colQty')}</span><span className="text-right">{t('colAmount')}</span>
        </div>
        {rows.length === 0 && <p className="py-2 text-center text-slate-500">{t('noItems')}</p>}
        {rows.map((r) => {
          const zero = qtyOf(r) <= 0
          return (
            <div key={r.key} className={`grid grid-cols-[1.1fr_1.4fr_0.9fr] items-start gap-2 rounded-lg p-1 ${zero ? 'bg-red-50' : ''}`}>
              <div className="flex flex-col gap-1">
                <input className="input px-2 py-2" placeholder={t('itemPh')} value={r.name}
                  onChange={(e) => patch(r.key, (x) => ({ ...x, name: e.target.value }))} />
                <button className={`text-left text-sm underline ${zero ? 'font-bold text-red-700' : 'text-slate-500'}`}
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>{t('removeItem')}</button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <button className="h-10 w-10 rounded-lg bg-slate-200 text-2xl font-bold active:scale-95" aria-label="Less"
                    onClick={() => patch(r.key, (x) => step(x, -1))}>−</button>
                  <input className="w-12 rounded-lg border border-slate-300 py-2 text-center text-lg" inputMode="decimal"
                    value={r.qtyText} onChange={(e) => patch(r.key, (x) => withQty(x, e.target.value))} />
                  <button className="h-10 w-10 rounded-lg bg-teal-700 text-2xl font-bold text-white active:scale-95" aria-label="More"
                    onClick={() => patch(r.key, (x) => step(x, 1))}>+</button>
                </div>
                <input className="w-20 rounded border border-slate-200 px-1 text-center text-sm" placeholder={t('unitPh')} value={r.unit}
                  onChange={(e) => patch(r.key, (x) => ({ ...x, unit: e.target.value }))} />
              </div>
              <input className="input px-2 py-2 text-right font-semibold" inputMode="decimal" placeholder="₹" value={r.amountText}
                onChange={(e) => patch(r.key, (x) => setAmount(x, e.target.value))} />
            </div>
          )
        })}
        <button className="btn-ghost" onClick={() => setRows([...rows, blank()])}>{t('addManual')}</button>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border-2 border-teal-700 p-3">
          <h3 className="text-lg font-bold">{t('summary')}</h3>
          <p className="text-lg">{t('totalItems')}: <b>{rows.length}</b></p>
          <p className="text-2xl">{t('totalAmount')}: <b>{formatINR(total)}</b></p>
          {err && <p className="mt-2 text-red-700">{err}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => tableRef.current?.scrollIntoView({ behavior: 'smooth' })}>{t('editItems')}</button>
            <button className="btn-primary" onClick={confirmAdd}>{t('confirmAdd')}</button>
          </div>
        </div>
      )}
      {rows.length === 0 && err && <p className="text-red-700">{err}</p>}
    </div>
  )
}
