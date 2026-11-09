import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { normalizePhone } from './money'
import type { Entry, EntryType, Item } from './types'

const customersCol = (shopId: string) => collection(db, 'shops', shopId, 'customers')
const ledgerCol = (shopId: string) => collection(db, 'shops', shopId, 'ledger')

// NOTE: Firestore commit() promises only resolve once the server acknowledges.
// Offline, local state updates immediately, so the UI never awaits these.
function fire(p: Promise<unknown>) {
  p.catch((err) => console.error('Sync error:', err))
}

export function newId(): string {
  return crypto.randomUUID()
}

export function addCustomer(
  shopId: string,
  uid: string,
  input: { name: string; phone: string; notes: string; openingPaise: number },
): string {
  const id = newId()
  const now = Date.now()
  const batch = writeBatch(db)
  batch.set(doc(customersCol(shopId), id), {
    name: input.name.trim(),
    phone: input.phone.trim(),
    normalizedPhone: normalizePhone(input.phone),
    notes: input.notes.trim(),
    isActive: true,
    createdAt: now,
  })
  if (input.openingPaise > 0) {
    batch.set(doc(ledgerCol(shopId), newId()), {
      customerId: id,
      type: 'opening',
      sign: 1,
      amountPaise: input.openingPaise,
      description: 'Opening balance',
      occurredAt: now,
      createdBy: uid,
    })
  }
  fire(batch.commit())
  return id
}

export function updateCustomer(
  shopId: string,
  id: string,
  patch: { name?: string; phone?: string; notes?: string; isActive?: boolean },
) {
  const data: Record<string, unknown> = { ...patch }
  if (patch.phone !== undefined) data.normalizedPhone = normalizePhone(patch.phone)
  fire(updateDoc(doc(customersCol(shopId), id), data))
}

/** Document ID = client UUID, so retries/duplicate uploads overwrite the same record (idempotent). */
export function addEntry(
  shopId: string,
  uid: string,
  e: {
    customerId: string
    type: EntryType
    amountPaise: number
    method?: string
    description?: string
    mode?: 'quick' | 'itemized'
    items?: Item[]
    occurredAt?: number
    reverses?: string
    sign?: 1 | -1
  },
): string {
  const id = newId()
  const sign: 1 | -1 = e.sign ?? (e.type === 'payment' ? -1 : 1)
  const entry: Omit<Entry, 'id' | 'pending'> = {
    customerId: e.customerId,
    type: e.type,
    sign,
    amountPaise: e.amountPaise,
    method: e.method,
    description: e.description?.trim() || undefined,
    mode: e.mode,
    items: e.items,
    reverses: e.reverses,
    occurredAt: e.occurredAt ?? Date.now(),
    createdBy: uid,
  }
  const batch = writeBatch(db)
  batch.set(doc(ledgerCol(shopId), id), entry)
  fire(batch.commit())
  return id
}

/** Mistakes are corrected with an opposite entry; originals are never edited or deleted. */
export function reverseEntry(shopId: string, uid: string, original: Entry) {
  return addEntry(shopId, uid, {
    customerId: original.customerId,
    type: 'reversal',
    sign: original.sign === 1 ? -1 : 1,
    amountPaise: original.amountPaise,
    description: `Reversal of ${original.type}`,
    reverses: original.id,
  })
}
