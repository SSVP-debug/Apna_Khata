import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, doc, onSnapshot, type QuerySnapshot, type DocumentData, type SnapshotListenOptions } from 'firebase/firestore'
import { db } from './firebase'
import { Ctx } from './storeContext'
import type { Customer, Entry } from './types'
import type { Product } from './products'
import { getLastSync, saveLastSync } from './settings'

export function StoreProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const shopId = uid // one shop per owner for now; path layout allows members later
  const [customers, setCustomers] = useState<Customer[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [shop, setShop] = useState({ name: '', phone: '' })
  const [products, setProducts] = useState<Product[]>([])
  const [lastSync, setLastSync] = useState<number | null>(getLastSync())
  const [pc, setPc] = useState(0)
  const [pe, setPe] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const opts: SnapshotListenOptions = { includeMetadataChanges: true }
    const u1 = onSnapshot(collection(db, 'shops', shopId, 'customers'), opts, (s: QuerySnapshot<DocumentData>) => {
      setCustomers(s.docs.map((d) => ({ ...(d.data() as Omit<Customer, 'id'>), id: d.id })))
      setPc(s.docs.filter((d) => d.metadata.hasPendingWrites).length)
    })
    const u2 = onSnapshot(collection(db, 'shops', shopId, 'ledger'), opts, (s: QuerySnapshot<DocumentData>) => {
      setEntries(
        s.docs.map((d) => ({
          ...(d.data() as Omit<Entry, 'id'>),
          id: d.id,
          pending: d.metadata.hasPendingWrites,
        })),
      )
      setPe(s.docs.filter((d) => d.metadata.hasPendingWrites).length)
      // Server-confirmed snapshot with nothing waiting = a successful sync.
      if (!s.metadata.fromCache && !s.metadata.hasPendingWrites) {
        const now = Date.now()
        saveLastSync(now)
        setLastSync(now)
      }
    })
    const u3 = onSnapshot(collection(db, 'shops', shopId, 'products'), (s: QuerySnapshot<DocumentData>) => {
      setProducts(s.docs.map((d) => ({ ...(d.data() as Omit<Product, 'id'>), id: d.id })))
    })
    const u4 = onSnapshot(doc(db, 'shops', shopId), (s) => {
      const d = s.data() as { name?: string; phone?: string } | undefined
      setShop({ name: d?.name ?? '', phone: d?.phone ?? '' })
    })
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      u1()
      u2()
      u3()
      u4()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [shopId])

  const value = useMemo(
    () => ({ shopId, uid, customers, entries, products, lastSync, shop, pending: pc + pe, online }),
    [shopId, uid, customers, entries, products, lastSync, shop, pc, pe, online],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
