import { createContext, useContext } from 'react'
import type { Customer, Entry } from './types'
import type { Product } from './products'

export interface Store {
  shopId: string
  uid: string
  customers: Customer[]
  entries: Entry[]
  products: Product[]
  lastSync: number | null
  shop: { name: string; phone: string }
  pending: number
  online: boolean
}

export const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
