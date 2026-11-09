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
import { useLang } from './lib/langContext'

export type View =
  | { name: 'home' }
  | { name: 'customers'; owingOnly?: boolean }
  | { name: 'customer'; id: string }
  | { name: 'txn'; id: string }
  | { name: 'settings' }

function Shell() {
  const { pending, online } = useStore()
  const { t } = useLang()
  const [view, setView] = useState<View>({ name: 'home' })
  const go = (v: View) => { setView(v); window.scrollTo(0, 0) }

  const tabs = [
    { name: 'home', label: 'navHome', icon: '🏠' },
    { name: 'customers', label: 'navCustomers', icon: '👥' },
    { name: 'settings', label: 'navSettings', icon: '⚙️' },
  ] as const
  const active = view.name === 'customer' ? 'customers' : view.name === 'txn' ? 'home' : view.name

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
        <b className="text-xl">Apna Khata</b>
        <span className="text-sm">{!online ? t('syncOffline') : pending ? t('syncPending', { n: pending }) : t('syncOk')}</span>
      </header>
      <main className="p-4">
        {view.name === 'home' && <Dashboard go={go} />}
        {view.name === 'customers' && <Customers go={go} owingOnly={view.owingOnly} />}
        {view.name === 'customer' && <Khata key={view.id} id={view.id} go={go} />}
        {view.name === 'txn' && <TxnDetail id={view.id} go={go} />}
        {view.name === 'settings' && <Settings />}
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
