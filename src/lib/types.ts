export interface Customer {
  id: string
  name: string
  phone: string
  normalizedPhone: string
  notes: string
  isActive: boolean
  createdAt: number
}

export type EntryType = 'opening' | 'bill' | 'payment' | 'reversal'

export interface Item {
  name: string
  qty: number
  unit: string
  unitPricePaise: number
  lineTotalPaise: number
}

export interface Entry {
  id: string
  customerId: string
  type: EntryType
  sign: 1 | -1
  amountPaise: number
  method?: string
  description?: string
  mode?: 'quick' | 'itemized'
  items?: Item[]
  reverses?: string
  occurredAt: number
  createdBy: string
  pending?: boolean // client-only, not written to DB
}
