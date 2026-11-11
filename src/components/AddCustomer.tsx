import { useState } from 'react'
import { useStore } from '../lib/storeContext'
import { addCustomer } from '../lib/db'
import { normName } from '../lib/labels'
import { allNames, displayName, variants } from '../lib/names'
import { WALK_IN_ID } from '../lib/walkin'
import type { Customer } from '../lib/types'
import type { View } from '../App'
import MicButton from './MicButton'
import { useLang } from '../lib/langContext'
import { parseRupees } from '../lib/money'

export default function AddCustomer({ onClose, go }: { onClose: () => void; go: (v: View) => void }) {
  const { shopId, uid, customers } = useStore()
  const { t, lang } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [opening, setOpening] = useState('')
  const [existing, setExisting] = useState<Customer | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [err, setErr] = useState('')

  function create() {
    const openingPaise = opening.trim() ? parseRupees(opening) : null
    if (opening.trim() && !openingPaise) {
      setErr(t('errValidOpening'))
      setExisting(null)
      setConfirmNew(false)
      return
    }
    const id = addCustomer(shopId, uid, {
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      openingPaise: openingPaise ?? 0,
    })
    onClose()
    go({ name: 'customer', id })
  }

  function submit() {
    if (!name.trim()) return setErr(t('enterName'))
    if (opening.trim() && !parseRupees(opening)) return setErr(t('errValidOpening'))
    setErr('')
    const v = variants(name)
    const mine = new Set([normName(name), normName(v.en), normName(v.te)])
    const found = customers.find((customer) => customer.id !== WALK_IN_ID && allNames(customer).some((value) => mine.has(value)))
    if (found) return setExisting(found)
    create()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
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
              onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
            <MicButton hint={t('sayName')} onText={(spokenName) => setName(spokenName.replace(/[.,]+$/, ''))} />
            <input className="input" inputMode="tel" placeholder={t('phoneOptional')} value={phone}
              onChange={(event) => setPhone(event.target.value)} />
            <input className="input" placeholder={t('notesOptional')} value={notes}
              onChange={(event) => setNotes(event.target.value)} />
            <input className="input" inputMode="decimal" placeholder={t('openingOptional')} value={opening}
              onChange={(event) => setOpening(event.target.value)} />
            <p className="text-sm text-slate-500">{t('openingHelp')}</p>
            {err && <p className="text-red-700">{err}</p>}
            <button className="btn-primary text-xl" onClick={submit}>{t('saveCustomer')}</button>
            <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
          </>
        )}
      </div>
    </div>
  )
}
