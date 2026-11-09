import { createContext, useContext } from 'react'
import type { Customer, Entry } from './types'

export interface Store {
  shopId: string
  uid: string
  customers: Customer[]
  entries: Entry[]
  pending: number
  online: boolean
}

export const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
