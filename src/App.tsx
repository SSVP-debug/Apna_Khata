import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { StoreProvider } from './lib/store'
import { useStore } from './lib/storeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Ledger from './pages/Ledger'
import EntryForm from './components/EntryForm'

export type View =
  | { name: 'home' }
  | { name: 'customers'; add?: boolean }
  | { name: 'customer'; id: string }
  | { name: 'bill' }
  | { name: 'payment' }
  | { name: 'ledger' }

function Shell() {
  const { pending, online } = useStore()
  const [view, setView] = useState<View>({ name: 'home' })
  const go = (v: View) => setView(v)
  const home = () => go({ name: 'home' })

  const tabs: { name: View['name']; label: string }[] = [
    { name: 'home', label: 'Home' },
    { name: 'customers', label: 'Customers' },
    { name: 'bill', label: '+ Bill' },
    { name: 'payment', label: 'Payment' },
    { name: 'ledger', label: 'Ledger' },
  ]
  const active = view.name === 'customer' ? 'customers' : view.name

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
        <b className="text-lg">Apna Khata</b>
        <div className="flex items-center gap-3 text-sm">
          <span>{!online ? '⚠ Offline' : pending ? `⏳ ${pending} pending` : '✓ Synced'}</span>
          <button className="underline" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </header>
      <main className="p-4">
        {view.name === 'home' && <Dashboard go={go} />}
        {view.name === 'customers' && <Customers go={go} startAdding={view.add} />}
        {view.name === 'customer' && <CustomerDetail id={view.id} go={go} />}
        {view.name === 'bill' && <EntryForm type="bill" onDone={home} />}
        {view.name === 'payment' && <EntryForm type="payment" onDone={home} />}
        {view.name === 'ledger' && <Ledger />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-white">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map((t) => (
            <button key={t.name} onClick={() => go({ name: t.name } as View)}
              className={`py-4 text-sm font-semibold ${active === t.name ? 'text-teal-700' : 'text-slate-500'}`}>
              {t.label}
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
  if (user === undefined) return <p className="p-6">Loading…</p>
  if (!user) return <Login />
  return (
    <StoreProvider uid={user.uid}>
      <Shell />
    </StoreProvider>
  )
}
