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

function fire(p: Promise<unknown>) {
  p.catch((err) => {
    console.error('Sync error:', err)
    window.dispatchEvent(new CustomEvent('khata-sync-error', { detail: 'Some changes could not be saved. Check your internet connection and try again.' }))
  })
}

export function newId(): string { return crypto.randomUUID() }

export function addCustomer(shopId: string, uid: string, input: { name: string; phone: string; notes: string; openingPaise: number }): string {
  const id = newId()
  const now = Date.now()
  const batch = writeBatch(db)
  const v = variants(input.name)
  batch.set(doc(customersCol(shopId), id), {
    name: input.name.trim(), nameEn: v.en, nameTe: v.te, phone: input.phone.trim(),
    normalizedPhone: normalizePhone(input.phone), notes: input.notes.trim(), isActive: true, createdAt: now,
  })
  if (input.openingPaise > 0) batch.set(doc(ledgerCol(shopId), newId()), {
    customerId: id, type: 'opening', sign: 1, amountPaise: input.openingPaise,
    description: 'Opening balance', occurredAt: now, createdBy: uid,
  })
  fire(batch.commit())
  return id
}

export function updateCustomer(shopId: string, id: string, patch: { name?: string; nameEn?: string; nameTe?: string; phone?: string; notes?: string; isActive?: boolean }) {
  const data: Record<string, unknown> = { ...patch }
  if (patch.phone !== undefined) data.normalizedPhone = normalizePhone(patch.phone)
  fire(updateDoc(doc(customersCol(shopId), id), data))
}

export function addEntry(shopId: string, uid: string, e: {
  customerId: string; type: EntryType; amountPaise: number; method?: string; description?: string
  mode?: 'quick' | 'itemized'; items?: Item[]; occurredAt?: number; reverses?: string; sign?: 1 | -1
}): string {
  const id = newId()
  const sign: 1 | -1 = e.sign ?? (e.type === 'payment' ? -1 : 1)
  const entry: Omit<Entry, 'id' | 'pending'> = {
    customerId: e.customerId, type: e.type, sign, amountPaise: e.amountPaise,
    method: e.method, description: e.description?.trim() || undefined, mode: e.mode,
    items: e.items, reverses: e.reverses, occurredAt: e.occurredAt ?? Date.now(), createdBy: uid,
  }
  const batch = writeBatch(db)
  batch.set(doc(ledgerCol(shopId), id), entry)
  fire(batch.commit())
  return id
}

function reversalMarkerId(originalId: string): string { return originalId }

/**
 * Reversals use a deterministic marker document ID. Firestore rules prevent two devices
 * from creating the same marker, while the append-only ledger keeps the original history.
 */
function addReversal(batch: ReturnType<typeof writeBatch>, shopId: string, uid: string, original: Entry) {
  batch.set(doc(ledgerCol(shopId), newId()), {
    customerId: original.customerId,
    type: 'reversal',
    sign: original.sign === 1 ? -1 : 1,
    amountPaise: original.amountPaise,
    description: `Reversal of ${original.type}`,
    reverses: original.id,
    occurredAt: Date.now(),
    createdBy: uid,
  })
  batch.set(doc(db, 'shops', shopId, 'reversalMarkers', reversalMarkerId(original.id)), {
    type: 'reversal-marker',
    originalId: original.id,
    createdBy: uid,
    createdAt: Date.now(),
  })
}

export function reverseEntry(shopId: string, uid: string, original: Entry, allEntries: Entry[] = []) {
  if (original.type === 'opening' || original.type === 'reversal') return
  if (allEntries.some((entry) => entry.reverses === original.id)) return
  const batch = writeBatch(db)
  addReversal(batch, shopId, uid, original)
  fire(batch.commit())
}

export function rememberProducts(shopId: string, items: { name: string; unit: string; unitPricePaise: number }[], existing: Product[]) {
  const batch = writeBatch(db)
  const seen = new Set<string>()
  for (const it of items) {
    if (!it.name.trim() || !(it.unitPricePaise > 0)) continue
    const id = productId(it.name, it.unit)
    if (seen.has(id)) continue
    seen.add(id)
    const prev = existing.find((p) => p.id === id)
    batch.set(doc(productsCol(shopId), id), {
      name: it.name.trim(), normalizedName: normName(it.name), unit: it.unit.trim(),
      unitPricePaise: Math.round(it.unitPricePaise), uses: (prev?.uses ?? 0) + 1, updatedAt: Date.now(),
    })
  }
  if (seen.size) fire(batch.commit())
}

export function saveProduct(shopId: string, prev: Product | null, v: { name: string; unit: string; unitPricePaise: number }) {
  const id = productId(v.name, v.unit)
  const batch = writeBatch(db)
  if (prev && prev.id !== id) batch.delete(doc(productsCol(shopId), prev.id))
  batch.set(doc(productsCol(shopId), id), {
    name: v.name.trim(), normalizedName: normName(v.name), unit: v.unit.trim(),
    unitPricePaise: Math.round(v.unitPricePaise), uses: prev?.uses ?? 0, updatedAt: Date.now(),
  })
  fire(batch.commit())
}

export function deleteProduct(shopId: string, id: string) {
  const batch = writeBatch(db)
  batch.delete(doc(productsCol(shopId), id))
  fire(batch.commit())
}

export function addBill(shopId: string, uid: string, input: {
  customerId: string; items: Item[]; totalPaise: number; settledBy?: 'cash' | 'upi' | 'other'; createWalkIn?: boolean
}): Entry {
  const now = Date.now()
  const batch = writeBatch(db)
  if (input.createWalkIn && input.customerId === WALK_IN_ID) batch.set(doc(customersCol(shopId), WALK_IN_ID), {
    name: walkInCustomer.name, nameEn: walkInCustomer.nameEn, nameTe: walkInCustomer.nameTe,
    phone: '', normalizedPhone: '', notes: '', isActive: true, createdAt: now,
  })
  const id = newId()
  const bill: Omit<Entry, 'id' | 'pending'> = {
    customerId: input.customerId, type: 'bill', sign: 1, amountPaise: input.totalPaise,
    mode: 'itemized', items: input.items, occurredAt: now, createdBy: uid, settledBy: input.settledBy,
  }
  batch.set(doc(ledgerCol(shopId), id), bill)
  if (input.settledBy) batch.set(doc(ledgerCol(shopId), newId()), {
    customerId: input.customerId, type: 'payment', sign: -1, amountPaise: input.totalPaise,
    method: input.settledBy, description: 'Paid at sale', billId: id, occurredAt: now, createdBy: uid,
  })
  fire(batch.commit())
  return { id, ...bill }
}

export function reverseSale(shopId: string, uid: string, bill: Entry, payment: Entry | undefined, allEntries: Entry[] = []) {
  const originals = payment ? [bill, payment] : [bill]
  if (originals.some((original) => allEntries.some((entry) => entry.reverses === original.id))) return
  const batch = writeBatch(db)
  addReversal(batch, shopId, uid, bill)
  if (payment) addReversal(batch, shopId, uid, payment)
  fire(batch.commit())
}

export function saveShop(shopId: string, v: { name: string; phone: string }) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'shops', shopId), { name: v.name.trim(), phone: v.phone.trim() })
  fire(batch.commit())
}
