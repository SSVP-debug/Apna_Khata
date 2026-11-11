import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useStore } from '../lib/storeContext'
import { toCSV, toJSONBackup } from '../lib/ledger'
import { useLang } from '../lib/langContext'
import { saveShop } from '../lib/db'
import { findCustomer } from '../lib/walkin'
import { formatWhen } from '../lib/labels'
import type { View } from '../App'
import { displayName } from '../lib/names'

interface InstallEvent extends Event {
  prompt(): Promise<void>
}

function ShopDetails({ shopId, shop }: { shopId: string; shop: { name: string; phone: string } }) {
  const { t } = useLang()
  const [name, setName] = useState(shop.name)
  const [phone, setPhone] = useState(shop.phone)
  const [saved, setSaved] = useState(false)
  return (
    <div className="card flex flex-col gap-2">
      <p className="text-slate-600">{t('shopSection')}</p>
      <input className="input" placeholder={t('shopNamePh')} value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
      <input className="input" inputMode="tel" placeholder={t('shopPhonePh')} value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }} />
      <button className="btn-primary" onClick={() => { saveShop(shopId, { name, phone }); setSaved(true) }}>
        {saved ? '✓ ' + t('shopSaved') : t('save')}
      </button>
    </div>
  )
}

export default function Settings({ go }: { go: (v: View) => void }) {
  const { shopId, shop, entries, customers, products, pending, online, lastSync } = useStore()
  const { t, lang, setLang } = useLang()
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  function downloadFile(filename: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportCSV() {
    const name = (id: string) => {
      const customer = findCustomer(customers, id)
      return customer ? displayName(customer, 'en') : ''
    }
    const rows = [...entries].sort((a, b) => a.occurredAt - b.occurredAt).map((entry) => [
      new Date(entry.occurredAt).toISOString().slice(0, 16).replace('T', ' '),
      name(entry.customerId), entry.type, entry.method ?? '',
      entry.sign === 1 ? (entry.amountPaise / 100).toFixed(2) : '',
      entry.sign === -1 ? (entry.amountPaise / 100).toFixed(2) : '',
      entry.description ?? '',
    ])
    const csv = toCSV([['Date', 'Customer', 'Type', 'Method', 'Goods added (INR)', 'Payment (INR)', 'Note'], ...rows])
    downloadFile(`apna-khata-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
  }

  function exportBackup() {
    const backup = toJSONBackup({ shop, customers, entries, products })
    downloadFile(`apna-khata-backup-${new Date().toISOString().slice(0, 10)}.json`, backup, 'application/json')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('settingsTitle')}</h1>
      <div className="card">
        <p className="text-slate-600">{t('account')}</p>
        <p className="text-lg font-semibold">{auth.currentUser?.email}</p>
      </div>
      <ShopDetails key={String(!!(shop.name || shop.phone))} shopId={shopId} shop={shop} />
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
        <p className="text-sm text-slate-500">{t('lastSynced')}: {lastSync ? formatWhen(lastSync, lang) : t('never')}</p>
      </div>
      <button className="btn-ghost" onClick={() => go({ name: 'products' })}>{t('productsBtn')}</button>
      <div className="card flex flex-col gap-2">
        {installEvt ? (
          <button className="btn-primary" onClick={() => installEvt.prompt()}>{t('installBtn')}</button>
        ) : (
          <p className="text-slate-600">{t('installHelp')}</p>
        )}
        <button className="btn-ghost" onClick={exportCSV}>{t('csv')}</button>
        <button className="btn-ghost" onClick={exportBackup}>{t('backup')}</button>
      </div>
      <button className="btn-ghost text-red-700" onClick={() => signOut(auth)}>{t('logout')}</button>
    </div>
  )
}
