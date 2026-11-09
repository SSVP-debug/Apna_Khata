import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot, type QuerySnapshot, type DocumentData, type SnapshotListenOptions } from 'firebase/firestore'
import { db } from './firebase'
import { Ctx } from './storeContext'
import type { Customer, Entry } from './types'

export function StoreProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const shopId = uid // one shop per owner for now; path layout allows members later
  const [customers, setCustomers] = useState<Customer[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
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
    })
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      u1()
      u2()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [shopId])

  const value = useMemo(
    () => ({ shopId, uid, customers, entries, pending: pc + pe, online }),
    [shopId, uid, customers, entries, pc, pe, online],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
