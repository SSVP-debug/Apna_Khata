import { normName } from './labels'

export interface Product {
  id: string
  name: string
  normalizedName: string
  unit: string
  unitPricePaise: number
  uses: number
  updatedAt: number
}

function fnv(s: string, seed: number): string {
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/** Deterministic id: the same item+unit always maps to one record, even if learned twice offline. */
export function productId(name: string, unit: string): string {
  const key = `${normName(name)}|${unit.trim().toLowerCase()}`
  return `p_${fnv(key, 2166136261)}${fnv(key, 5381)}`
}

function canon(s: string): string {
  const n = normName(s)
  return n.length > 3 && /^[a-z]+$/.test(n) && n.endsWith('s') ? n.slice(0, -1) : n
}

/**
 * Find a remembered price. If a unit was given it must match (no "per kg" price for a packet).
 * If no unit was given, the most-used record for that name wins.
 */
export function findProduct(products: Product[], name: string, unit: string): Product | undefined {
  const k = canon(name)
  if (!k) return undefined
  const byName = products.filter((p) => canon(p.name) === k)
  const u = unit.trim().toLowerCase()
  const pool = u ? byName.filter((p) => p.unit.toLowerCase() === u) : byName
  return [...pool].sort((a, b) => b.uses - a.uses || b.updatedAt - a.updatedAt)[0]
}

export const priceFor = (p: Product, qty: number) => Math.round(p.unitPricePaise * qty)
