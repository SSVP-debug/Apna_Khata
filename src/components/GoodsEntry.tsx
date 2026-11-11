import { useRef, useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addBill, newId, rememberProducts } from '../lib/db'
import { WALK_IN_ID, findCustomer } from '../lib/walkin'
import BillShare from './BillShare'
import { checkPrice, findProduct, priceFor, productsByName, type PriceCheck, type Product } from '../lib/products'
import { formatINR, parseRupees } from '../lib/money'
import { parseItems, type ParsedItem } from '../lib/parseItems'
import type { Entry, Item } from '../lib/types'
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
  suggested: boolean // price came from remembered items
  ackedPaise: number | null // unit price the owner chose to keep after a price warning
}

const textOf = (p: number) => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2))
const qtyOf = (r: Row) => {
  const q = Number(r.qtyText)
  return Number.isFinite(q) && q > 0 ? q : 0
}

function fromParsed(p: ParsedItem): Row {
  const unitPricePaise = p.amountPaise ? p.amountPaise / p.qty : 0
  return { key: newId(), name: p.name, qtyText: String(p.qty), unit: p.unit, unitPricePaise, amountText: p.amountPaise ? textOf(p.amountPaise) : '', suggested: false, ackedPaise: null }
}
/** If the amount is empty and the item is remembered, fill in the saved price (still editable). */
function applyMemory(r: Row, products: Product[]): Row {
  if (r.amountText.trim() || !r.name.trim()) return r
  const p = findProduct(products, r.name, r.unit)
  if (!p) return r
  const q = qtyOf(r) || 1
  return { ...r, unit: r.unit || p.unit, unitPricePaise: p.unitPricePaise, amountText: textOf(priceFor(p, q)), suggested: true }
}
/** Unit price currently entered on a row (amount / quantity), or null if not computable yet. */
function unitPriceOf(r: Row): number | null {
  const a = parseRupees(r.amountText)
  const q = qtyOf(r)
  return a && q > 0 ? a / q : null
}

/** Compare with the remembered price. Only when the unit is known, so units are never mixed up. */
function priceWarning(r: Row, products: Product[]): { level: PriceCheck; saved: Product; now: number } | null {
  if (!r.name.trim()) return null
  const now = unitPriceOf(r)
  if (now === null) return null
  // No unit spoken: only compare when this item has exactly one saved unit (never guess between kg and packet).
  if (!r.unit.trim() && new Set(productsByName(products, r.name).map((p) => p.unit)).size !== 1) return null
  const saved = findProduct(products, r.name, r.unit)
  if (!saved) return null
  if (r.ackedPaise !== null && Math.abs(r.ackedPaise - now) < 1) return null
  const level = checkPrice(saved.unitPricePaise, now)
  return level === 'ok' ? null : { level, saved, now }
}

const blank = (): Row => ({ key: newId(), name: '', qtyText: '1', unit: '', unitPricePaise: 0, amountText: '', suggested: false, ackedPaise: null })

export default function GoodsEntry({ customerId, customerName }: { customerId: string; customerName: string }) {
  const { shopId, uid, products, online, customers } = useStore()
  const walkIn = customerId === WALK_IN_ID
  const [payOpen, setPayOpen] = useState(false)
  const [saved, setSaved] = useState<Entry | null>(null)
  const [sharing, setSharing] = useState(false)
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
    return { ...r, amountText, suggested: false, unitPricePaise: a && q > 0 ? a / q : r.unitPricePaise }
  }

  function addFromText(text: string) {
    const parsed = parseItems(text)
    if (!parsed.length) return setErr(t('errUnderstand'))
    setErr('')
    setDone('')
    setRows((rs) => [...rs, ...parsed.map(fromParsed).map((r) => applyMemory(r, products))])
  }

  const frequent = [...products].sort((a, b) => b.uses - a.uses || b.updatedAt - a.updatedAt).slice(0, 8)
  const lines = rows.map((r) => parseRupees(r.amountText))
  const total = lines.reduce<number>((s, a) => s + (a ?? 0), 0)

  /** Validate the table and build the bill items; returns null (and sets an error) if something is wrong. */
  function prepare(): Item[] | null {
    const fail = (m: string): null => { setErr(m); return null }
    setDone('')
    setSaved(null)
    if (!rows.length) return fail(t('errAddOne'))
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.name.trim()) return fail(t('errNeedName'))
      if (qtyOf(r) <= 0) return fail(t('errQtyZero', { name: r.name }))
      if (!lines[i]) return fail(t('errNeedAmount', { name: r.name }))
    }
    if (rows.some((x) => priceWarning(x, products))) return fail(t('errPriceCheck'))
    const items: Item[] = rows.map((r, i) => ({
      name: r.name.trim(), qty: qtyOf(r), unit: r.unit.trim() || 'pcs',
      unitPricePaise: Math.round(lines[i]! / qtyOf(r)), lineTotalPaise: lines[i]!,
    }))
    setErr('')
    return items
  }

  /** Close the popup and return to a clean, empty form at the top of the page. */
  function finish() {
    setSharing(false)
    setSaved(null)
    setDone('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Save the bill: on credit (Khata) or paid on the spot (cash/UPI/other). */
  function save(settledBy?: 'cash' | 'upi' | 'other') {
    const items = prepare()
    if (!items) return
    const bill = addBill(shopId, uid, {
      customerId, items, totalPaise: total, settledBy,
      createWalkIn: walkIn && !customers.some((c) => c.id === WALK_IN_ID),
    })
    rememberProducts(shopId, items.map((i) => ({ name: i.name, unit: i.unit, unitPricePaise: i.unitPricePaise })), products)
    const offlineNote = online ? '' : ' ' + t('savedOffline')
    setDone(
      (settledBy
        ? t('paidSuccess', { amt: formatINR(total), method: t(settledBy), name: customerName })
        : t('goodsSuccess', { amt: formatINR(total), name: customerName })) + offlineNote,
    )
    setSaved(bill)
    setPayOpen(false)
    setRows([])
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t('addGoods')}</h2>
      {/* After saving: a popup that is always on screen, so the owner never has to scroll to find "Share". */}
      {saved && !sharing && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="flex w-full max-w-md flex-col gap-3 rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <p className="text-center text-5xl">✅</p>
            <p className="text-center text-xl font-semibold text-green-800">{done}</p>
            <button className="btn-primary py-4 text-xl" onClick={() => setSharing(true)}>📲 {t('shareBill')}</button>
            <button className="btn-ghost" onClick={finish}>{t('done')}</button>
          </div>
        </div>
      )}
      {sharing && saved && (() => {
        const cust = findCustomer(customers, saved.customerId)
        return cust ? <BillShare bill={saved} customer={cust} onClose={finish} /> : null
      })()}

      <MicButton hint={t('tapAllGoods')} onText={addFromText} />

      {frequent.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-slate-600">{t('frequent')}</p>
          <div className="flex flex-wrap gap-2">
            {frequent.map((p) => (
              <button key={p.id} className="rounded-full bg-teal-50 px-3 py-2 text-base font-semibold text-teal-800 active:scale-95"
                onClick={() => { setDone(''); setRows((rs) => [...rs, { key: newId(), name: p.name, qtyText: '1', unit: p.unit, unitPricePaise: p.unitPricePaise, amountText: textOf(p.unitPricePaise), suggested: true, ackedPaise: null }]) }}>
                {p.name} · {formatINR(p.unitPricePaise)}/{p.unit}
              </button>
            ))}
          </div>
        </div>
      )}

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
          const warn = priceWarning(r, products)
          return (
            <div key={r.key} className={`grid grid-cols-[1.1fr_1.4fr_0.9fr] items-start gap-2 rounded-lg p-1 ${zero ? 'bg-red-50' : ''}`}>
              <div className="flex flex-col gap-1">
                <input className="input px-2 py-2" placeholder={t('itemPh')} value={r.name}
                  onChange={(e) => patch(r.key, (x) => ({ ...x, name: e.target.value }))}
                  onBlur={() => patch(r.key, (x) => applyMemory(x, products))} />
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
              <div className="flex flex-col gap-1">
                <input className="input px-2 py-2 text-right font-semibold" inputMode="decimal" placeholder="₹" value={r.amountText}
                  onChange={(e) => patch(r.key, (x) => setAmount(x, e.target.value))} />
                {r.suggested && r.unitPricePaise > 0 && (
                  <span className="text-right text-xs text-amber-700">{t('savedPrice', { p: `${formatINR(Math.round(r.unitPricePaise))}/${r.unit || 'pcs'}` })}</span>
                )}
              </div>
              {warn && (
                <div className={`col-span-3 rounded-lg border-2 p-2 ${warn.level === 'very-different' ? 'border-red-500 bg-red-50' : 'border-amber-400 bg-amber-50'}`}>
                  <p className="font-bold">⚠ {warn.level === 'very-different' ? t('priceVeryDifferent') : t('priceChanged')}</p>
                  <p>{t('priceLastNow', { old: `${formatINR(warn.saved.unitPricePaise)}/${warn.saved.unit}`, now: `${formatINR(Math.round(warn.now))}/${r.unit || warn.saved.unit}` })}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button className="btn-primary py-2"
                      onClick={() => patch(r.key, (x) => ({ ...x, unitPricePaise: warn.saved.unitPricePaise, amountText: textOf(priceFor(warn.saved, qtyOf(x) || 1)), suggested: true, ackedPaise: null }))}>
                      {t('useOld', { old: `${formatINR(warn.saved.unitPricePaise)}/${warn.saved.unit}` })}
                    </button>
                    <button className="btn-ghost py-2" onClick={() => patch(r.key, (x) => ({ ...x, ackedPaise: warn.now }))}>
                      {t('keepNew', { now: `${formatINR(Math.round(warn.now))}/${r.unit || warn.saved.unit}` })}
                    </button>
                  </div>
                </div>
              )}
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
          {payOpen ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="font-semibold">{t('chooseMethod')}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'upi', 'other'] as const).map((m) => (
                  <button key={m} className="btn-primary" onClick={() => save(m)}>{t(m)}</button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => setPayOpen(false)}>{t('cancel')}</button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn-primary text-lg" onClick={() => { if (prepare()) setPayOpen(true) }}>💵 {t('paidNow')}</button>
              {!walkIn && <button className="btn-ghost" onClick={() => save()}>{t('confirmAdd')}</button>}
              <button className="btn-ghost" onClick={() => tableRef.current?.scrollIntoView({ behavior: 'smooth' })}>{t('editItems')}</button>
            </div>
          )}
        </div>
      )}
      {rows.length === 0 && err && <p className="text-red-700">{err}</p>}
    </div>
  )
}
