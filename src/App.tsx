import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { StoreProvider } from './lib/store'
import { useStore } from './lib/storeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Khata from './pages/Khata'
import TxnDetail from './pages/TxnDetail'
import Settings from './pages/Settings'
import type { CustomerFilter } from './pages/Customers'
import Products from './pages/Products'
import WholesaleOrder from './pages/WholesaleOrder'
import { WALK_IN_ID } from './lib/walkin'
import { useLang } from './lib/langContext'

export type View =
  | { name: 'home' }
  | { name: 'customers'; filter?: CustomerFilter }
  | { name: 'customer'; id: string }
  | { name: 'txn'; id: string }
  | { name: 'settings' }
  | { name: 'products' }
  | { name: 'wholesale' }

function Shell() {
  const { pending, online } = useStore()
  const { t } = useLang()
  const [view, setView] = useState<View>({ name: 'home' })
  const [syncErr, setSyncErr] = useState('')
  useEffect(() => {
    const h = (e: Event) => setSyncErr((e as CustomEvent<string>).detail || 'unknown error')
    window.addEventListener('khata-sync-error', h)
    return () => window.removeEventListener('khata-sync-error', h)
  }, [])
  const go = (v: View) => { setView(v); window.scrollTo(0, 0) }

  const tabs = [
    { name: 'home', label: 'navHome', icon: '🏠' },
    { name: 'customers', label: 'navCustomers', icon: '👥' },
    { name: 'settings', label: 'navSettings', icon: '⚙️' },
  ] as const
  const active = view.name === 'wholesale' ? 'home' : view.name === 'customer' ? (view.id === WALK_IN_ID ? 'home' : 'customers') : view.name === 'txn' ? 'home' : view.name === 'products' ? 'settings' : view.name

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
        <b className="text-xl">Apna Khata</b>
        <span className="text-sm">{!online ? t('syncOffline') : pending ? t('syncPending', { n: pending }) : t('syncOk')}</span>
      </header>
      {!online && <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">{t('offlineBanner')}</div>}
      {syncErr && (
        <div className="flex items-start justify-between gap-2 bg-red-100 px-4 py-2 text-sm text-red-900">
          <span>{t('syncError', { msg: syncErr })}</span>
          <button className="font-bold underline" onClick={() => setSyncErr('')}>{t('dismiss')}</button>
        </div>
      )}
      <main className="p-4">
        {view.name === 'home' && <Dashboard go={go} />}
        {view.name === 'customers' && <Customers key={view.filter ?? 'all'} go={go} initialFilter={view.filter} />}
        {view.name === 'customer' && <Khata key={view.id} id={view.id} go={go} />}
        {view.name === 'txn' && <TxnDetail id={view.id} go={go} />}
        {view.name === 'settings' && <Settings go={go} />}
        {view.name === 'products' && <Products go={go} />}
        {view.name === 'wholesale' && <WholesaleOrder go={go} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-white">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map((tab) => (
            <button key={tab.name} onClick={() => go({ name: tab.name })}
              className={`flex flex-col items-center py-3 text-base font-semibold ${active === tab.name ? 'text-teal-700' : 'text-slate-500'}`}>
              <span className="text-2xl">{tab.icon}</span>{t(tab.label)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  if (user === undefined) return <p className="p-6 text-lg">…</p>
  if (!user) return <Login />
  return (
    <StoreProvider uid={user.uid}>
      <Shell />
    </StoreProvider>
  )
}
