import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { WALK_IN_ID, walkInCustomer } from './walkin'
import { productId, type Product } from './products'
import { db } from './firebase'
import { normalizePhone } from './money'
import { normName } from './labels'
import { variants } from './names'
import type { Entry, EntryType, Item } from './types'

const customersCol = (shopId: string) => collection(db, 'shops', shopId, 'customers')
const ledgerCol = (shopId: string) => collection(db, 'shops', shopId, 'ledger')
const productsCol = (shopId: string) => collection(db, 'shops', shopId, 'products')

// NOTE: Firestore commit() promises only resolve once the server acknowledges.
// Offline, local state updates immediately, so the UI never awaits these.
function fire(p: Promise<unknown>) {
  p.catch((err) => {
    console.error('Sync error:', err)
    // Surface rejected writes so the owner never thinks something was saved when it was not.
    window.dispatchEvent(new CustomEvent('khata-sync-error', { detail: (err as Error).message }))
  })
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
  const v = variants(input.name)
  batch.set(doc(customersCol(shopId), id), {
    name: input.name.trim(),
    nameEn: v.en,
    nameTe: v.te,
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
  patch: { name?: string; nameEn?: string; nameTe?: string; phone?: string; notes?: string; isActive?: boolean },
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

/** Learn prices from a confirmed bill (latest price wins; usage count drives "frequent items"). */
export function rememberProducts(
  shopId: string,
  items: { name: string; unit: string; unitPricePaise: number }[],
  existing: Product[],
) {
  const batch = writeBatch(db)
  const seen = new Set<string>()
  for (const it of items) {
    if (!it.name.trim() || !(it.unitPricePaise > 0)) continue
    const id = productId(it.name, it.unit)
    if (seen.has(id)) continue
    seen.add(id)
    const prev = existing.find((p) => p.id === id)
    batch.set(doc(productsCol(shopId), id), {
      name: it.name.trim(),
      normalizedName: normName(it.name),
      unit: it.unit.trim(),
      unitPricePaise: it.unitPricePaise,
      uses: (prev?.uses ?? 0) + 1,
      updatedAt: Date.now(),
    })
  }
  if (seen.size) fire(batch.commit())
}

export function saveProduct(
  shopId: string,
  prev: Product | null,
  v: { name: string; unit: string; unitPricePaise: number },
) {
  const id = productId(v.name, v.unit)
  const batch = writeBatch(db)
  if (prev && prev.id !== id) batch.delete(doc(productsCol(shopId), prev.id))
  batch.set(doc(productsCol(shopId), id), {
    name: v.name.trim(),
    normalizedName: normName(v.name),
    unit: v.unit.trim(),
    unitPricePaise: v.unitPricePaise,
    uses: prev?.uses ?? 0,
    updatedAt: Date.now(),
  })
  fire(batch.commit())
}

export function deleteProduct(shopId: string, id: string) {
  const batch = writeBatch(db)
  batch.delete(doc(productsCol(shopId), id))
  fire(batch.commit())
}

/**
 * Save an itemized bill. With `settledBy` the sale is paid on the spot: the bill and its payment are
 * written together in ONE batch, so a sale can never be half-saved.
 */
export function addBill(
  shopId: string,
  uid: string,
  input: {
    customerId: string
    items: Item[]
    totalPaise: number
    settledBy?: 'cash' | 'upi' | 'other'
    createWalkIn?: boolean
  },
): Entry {
  const now = Date.now()
  const batch = writeBatch(db)
  if (input.createWalkIn && input.customerId === WALK_IN_ID) {
    batch.set(doc(customersCol(shopId), WALK_IN_ID), {
      name: walkInCustomer.name,
      nameEn: walkInCustomer.nameEn,
      nameTe: walkInCustomer.nameTe,
      phone: '',
      normalizedPhone: '',
      notes: '',
      isActive: true,
      createdAt: now,
    })
  }
  const id = newId()
  const bill: Omit<Entry, 'id' | 'pending'> = {
    customerId: input.customerId,
    type: 'bill',
    sign: 1,
    amountPaise: input.totalPaise,
    mode: 'itemized',
    items: input.items,
    occurredAt: now,
    createdBy: uid,
    settledBy: input.settledBy,
  }
  batch.set(doc(ledgerCol(shopId), id), bill)
  if (input.settledBy) {
    batch.set(doc(ledgerCol(shopId), newId()), {
      customerId: input.customerId,
      type: 'payment',
      sign: -1,
      amountPaise: input.totalPaise,
      method: input.settledBy,
      description: 'Paid at sale',
      billId: id,
      occurredAt: now,
      createdBy: uid,
    })
  }
  fire(batch.commit())
  return { id, ...bill }
}

/** Cancel a sale that was paid on the spot: both the bill and its payment are reversed together. */
export function reverseSale(shopId: string, uid: string, bill: Entry, payment: Entry | undefined) {
  const batch = writeBatch(db)
  for (const e of payment ? [bill, payment] : [bill]) {
    batch.set(doc(ledgerCol(shopId)), {
      customerId: e.customerId,
      type: 'reversal',
      sign: e.sign === 1 ? -1 : 1,
      amountPaise: e.amountPaise,
      description: `Reversal of ${e.type}`,
      reverses: e.id,
      occurredAt: Date.now(),
      createdBy: uid,
    })
  }
  fire(batch.commit())
}

export function saveShop(shopId: string, v: { name: string; phone: string }) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'shops', shopId), { name: v.name.trim(), phone: v.phone.trim() })
  fire(batch.commit())
}
