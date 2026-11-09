import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useStore } from '../lib/storeContext'
import { toCSV } from '../lib/ledger'
import { useLang } from '../lib/langContext'

interface InstallEvent extends Event {
  prompt(): Promise<void>
}

export default function Settings() {
  const { entries, customers, pending, online } = useStore()
  const { t, lang, setLang } = useLang()
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  function exportCSV() {
    const name = (id: string) => customers.find((c) => c.id === id)?.name ?? ''
    const rows = [...entries].sort((a, b) => a.occurredAt - b.occurredAt).map((e) => [
      new Date(e.occurredAt).toISOString().slice(0, 16).replace('T', ' '), name(e.customerId), e.type, e.method ?? '',
      e.sign === 1 ? (e.amountPaise / 100).toFixed(2) : '', e.sign === -1 ? (e.amountPaise / 100).toFixed(2) : '', e.description ?? '',
    ])
    const csv = toCSV([['Date', 'Customer', 'Type', 'Method', 'Goods added (INR)', 'Payment (INR)', 'Note'], ...rows])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `apna-khata-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('settingsTitle')}</h1>
      <div className="card">
        <p className="text-slate-600">{t('account')}</p>
        <p className="text-lg font-semibold">{auth.currentUser?.email}</p>
      </div>
      <div className="card flex flex-col gap-2">
        <p className="text-slate-600">{t('language')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className={lang === 'en' ? 'btn-primary' : 'btn-ghost'} onClick={() => setLang('en')}>English</button>
          <button className={lang === 'te' ? 'btn-primary' : 'btn-ghost'} onClick={() => setLang('te')}>తెలుగు</button>
        </div>
        <p className="text-sm text-slate-500">{t('langNote')}</p>
      </div>
      <div className="card">
        <p className="text-slate-600">{t('syncLabel')}</p>
        <p className="text-lg font-semibold">{!online ? t('offline') : pending ? t('waiting', { n: pending }) : t('allSynced')}</p>
      </div>
      <div className="card flex flex-col gap-2">
        {installEvt ? (
          <button className="btn-primary" onClick={() => installEvt.prompt()}>{t('installBtn')}</button>
        ) : (
          <p className="text-slate-600">{t('installHelp')}</p>
        )}
        <button className="btn-ghost" onClick={exportCSV}>{t('csv')}</button>
      </div>
      <button className="btn-ghost text-red-700" onClick={() => signOut(auth)}>{t('logout')}</button>
    </div>
  )
}
