import { formatINR } from '../lib/money'
import { withRunning } from '../lib/ledger'
import type { Entry } from '../lib/types'

export default function LedgerTable({
  entries,
  onReverse,
}: {
  entries: Entry[]
  onReverse?: (e: Entry) => void
}) {
  const reversed = new Set(entries.filter((e) => e.reverses).map((e) => e.reverses))
  const rows = withRunning(entries)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="py-2">Date</th><th>Entry</th>
            <th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-slate-100 align-top">
              <td className="py-2 whitespace-nowrap">{new Date(e.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
              <td>
                {e.type}{e.method ? ` (${e.method})` : ''}{e.pending && ' ⏳'}
                {reversed.has(e.id) && <span className="text-xs text-slate-400"> reversed</span>}
                {e.description && <div className="text-xs text-slate-500">{e.description}</div>}
                {e.items?.map((i, k) => (
                  <div key={k} className="text-xs text-slate-500">{i.name} {i.qty}{i.unit} × {formatINR(i.unitPricePaise)}</div>
                ))}
                {onReverse && e.type !== 'reversal' && e.type !== 'opening' && !reversed.has(e.id) && (
                  <button className="text-xs text-red-700 underline" onClick={() => onReverse(e)}>Reverse</button>
                )}
              </td>
              <td className="text-right text-red-700">{e.sign === 1 ? formatINR(e.amountPaise) : ''}</td>
              <td className="text-right text-teal-700">{e.sign === -1 ? formatINR(e.amountPaise) : ''}</td>
              <td className="text-right font-semibold">{formatINR(e.running)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-4 text-center text-slate-500">No transactions.</p>}
    </div>
  )
}
