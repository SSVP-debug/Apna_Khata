import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addCustomer } from '../lib/db'
import { normName } from '../lib/labels'
import { allNames, displayName, variants } from '../lib/names'
import type { Customer } from '../lib/types'
import type { View } from '../App'
import MicButton from './MicButton'
import { useLang } from '../lib/langContext'

export default function AddCustomer({ onClose, go }: { onClose: () => void; go: (v: View) => void }) {
  const { shopId, uid, customers } = useStore()
  const { t, lang } = useLang()
  const [name, setName] = useState('')
  const [existing, setExisting] = useState<Customer | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [err, setErr] = useState('')

  function create() {
    const id = addCustomer(shopId, uid, { name, phone: '', notes: '', openingPaise: 0 })
    onClose()
    go({ name: 'customer', id })
  }

  function submit() {
    if (!name.trim()) return setErr(t('enterName'))
    setErr('')
    // Same person in either script counts as a duplicate (Ramesh = రమేష్).
    const v = variants(name)
    const mine = new Set([normName(name), normName(v.en), normName(v.te)])
    const found = customers.find((c) => allNames(c).some((n) => mine.has(n)))
    if (found) return setExisting(found)
    create()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        {existing ? (
          <>
            <h2 className="text-2xl font-bold text-amber-700">{t('existsTitle')}</h2>
            <p className="text-lg">{t('existsMsg', { name: displayName(existing, lang) })}</p>
            {confirmNew ? (
              <>
                <p className="rounded-lg bg-amber-50 p-3">{t('sure', { name: name.trim() })}</p>
                <button className="btn-primary" onClick={create}>{t('yesCreate')}</button>
                <button className="btn-ghost" onClick={() => setConfirmNew(false)}>{t('goBack')}</button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={() => { onClose(); go({ name: 'customer', id: existing.id }) }}>{t('openExisting')}</button>
                <button className="btn-ghost" onClick={() => setConfirmNew(true)}>{t('createNew')}</button>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">{t('addCustomerTitle')}</h2>
            <input className="input text-xl" placeholder={t('namePh')} autoFocus value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            <MicButton hint={t('sayName')} onText={(t) => setName(t.replace(/[.,]+$/, ''))} />
            {err && <p className="text-red-700">{err}</p>}
            <button className="btn-primary text-xl" onClick={submit}>{t('saveCustomer')}</button>
            <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
          </>
        )}
      </div>
    </div>
  )
}
