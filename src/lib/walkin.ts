import type { Customer } from './types'

/** Built-in customer for people who pay on the spot (no Khata needed). */
export const WALK_IN_ID = 'walk-in'

export const walkInCustomer: Customer = {
  id: WALK_IN_ID,
  name: 'Cash Sales',
  nameEn: 'Cash Sales',
  nameTe: 'నగదు అమ్మకాలు',
  phone: '',
  normalizedPhone: '',
  notes: '',
  isActive: true,
  createdAt: 0,
}

/** Find a customer; the walk-in customer is available even before its first sale is saved. */
export function findCustomer(customers: Customer[], id: string): Customer | undefined {
  return customers.find((c) => c.id === id) ?? (id === WALK_IN_ID ? walkInCustomer : undefined)
}
