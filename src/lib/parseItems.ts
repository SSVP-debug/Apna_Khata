export interface ParsedItem {
  name: string
  qty: number
  unit: string
  amountPaise: number | null
}

// Number words. Telugu entries are experimental until tested on real devices.
const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, half: 0.5, quarter: 0.25,
  ఒకటి: 1, ఒక: 1, రెండు: 2, మూడు: 3, నాలుగు: 4, ఐదు: 5, ఆరు: 6, ఏడు: 7, ఎనిమిది: 8, తొమ్మిది: 9, పది: 10,
  పదకొండు: 11, పన్నెండు: 12, పదమూడు: 13, పద్నాలుగు: 14, పదిహేను: 15, పదహారు: 16, పదిహేడు: 17, పద్దెనిమిది: 18, పంతొమ్మిది: 19,
  ఇరవై: 20, ముప్పై: 30, నలభై: 40, యాభై: 50, యాభయ్: 50, అరవై: 60, డెబ్బై: 70, ఎనభై: 80, తొంభై: 90,
  వంద: 100, వందల: 100, వందలు: 100, నూరు: 100, నూట: 100, వెయ్యి: 1000, వేలు: 1000, వేల: 1000,
  అర: 0.5, పావు: 0.25, ముప్పావు: 0.75, ఒకటిన్నర: 1.5, రెండున్నర: 2.5, మూడున్నర: 3.5,
}

const UNITS: Record<string, string> = {
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  g: 'g', gm: 'g', gram: 'g', grams: 'g',
  litre: 'litre', litres: 'litre', liter: 'litre', liters: 'litre', ltr: 'litre', l: 'litre',
  packet: 'packet', packets: 'packet', pkt: 'packet',
  piece: 'pcs', pieces: 'pcs', pc: 'pcs', pcs: 'pcs',
  dozen: 'dozen', bottle: 'bottle', bottles: 'bottle', box: 'box', boxes: 'box', bag: 'bag', bags: 'bag',
  కిలో: 'kg', కిలోలు: 'kg', కిలోల: 'kg', కేజీ: 'kg', కేజీలు: 'kg', కేజీల: 'kg',
  గ్రాము: 'g', గ్రాములు: 'g', గ్రాముల: 'g',
  లీటర్: 'litre', లీటరు: 'litre', లీటర్లు: 'litre', లీటర్ల: 'litre',
  ప్యాకెట్: 'packet', ప్యాకెట్లు: 'packet', ప్యాకెట్ల: 'packet',
  డజను: 'dozen', డజన్: 'dozen', సీసా: 'bottle', సీసాలు: 'bottle',
}

const FILLER = new Set(['of', 'rupees', 'rupee', 'rs', 'inr', 'రూపాయలు', 'రూపాయి', 'రూపాయల', 'రూ'])
const TELUGU_DIGITS = '౦౧౨౩౪౫౬౭౮౯'

const isDigit = (t: string) => /^\d+(\.\d+)?$/.test(t)

interface Tok {
  t: string
  n: number | null
  words: boolean // number came from spoken words (not typed digits)
}

/** "నూట ఇరవై" -> 120, "two hundred fifty" -> 250 */
function combine(run: number[]): number {
  let total = 0
  let cur = 0
  for (const v of run) {
    if (v === 100) cur = (cur || 1) * 100
    else if (v === 1000) { total += (cur || 1) * 1000; cur = 0 }
    else cur += v
  }
  return total + cur
}

function lex(words: string[]): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < words.length) {
    const w = words[i]
    if (isDigit(w)) { out.push({ t: w, n: Number(w), words: false }); i++; continue }
    if (NUM_WORDS[w] !== undefined) {
      let j = i
      const run: number[] = []
      while (j < words.length && !isDigit(words[j]) && NUM_WORDS[words[j]] !== undefined) run.push(NUM_WORDS[words[j++]])
      if (run.every(Number.isInteger)) out.push({ t: words.slice(i, j).join(' '), n: combine(run), words: true })
      else for (let k = i; k < j; k++) out.push({ t: words[k], n: NUM_WORDS[words[k]], words: true })
      i = j
      continue
    }
    out.push({ t: w, n: null, words: false })
    i++
  }
  return out
}

/** Rules-based parser. Never guesses amounts: a missing amount is returned as null. */
export function parseItems(text: string): ParsedItem[] {
  const normalized = text
    .toLowerCase()
    .replace(/[౦-౯]/g, (d) => String(TELUGU_DIGITS.indexOf(d)))
  const segments = normalized.split(/[,;\n]+|\s+and\s+|\s+then\s+|\s+మరియు\s+|\s+ఇంకా\s+/)
  const out: ParsedItem[] = []

  for (const seg of segments) {
    const cleaned = seg
      .replace(/₹/g, ' ')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/[^\p{L}\p{M}\p{N}.\s]/gu, ' ')
    const words = cleaned.split(/\s+/).map((t) => t.replace(/^\.+|\.+$/g, '')).filter(Boolean)
    if (!words.length || words[0] === 'total' || words[0] === 'మొత్తం') continue

    const toks = lex(words)
    const numIdx = toks.map((k, i) => (k.n !== null ? i : -1)).filter((i) => i >= 0)

    let amountIdx = -1
    let qtyIdx = -1
    if (numIdx.length >= 2) {
      amountIdx = numIdx[numIdx.length - 1]
      qtyIdx = numIdx[0]
    } else if (numIdx.length === 1) {
      const i = numIdx[0]
      const k = toks[i]
      const nextIsUnit = !!UNITS[toks[i + 1]?.t]
      if (nextIsUnit || (k.words && (k.n ?? 0) <= 20)) qtyIdx = i
      else amountIdx = i
    }

    const qtyRaw = qtyIdx >= 0 ? (toks[qtyIdx].n ?? 1) : 1
    const qty = qtyRaw > 0 ? Math.round(qtyRaw * 100) / 100 : 1
    const unitIdx = toks.findIndex((k, i) => i !== qtyIdx && i !== amountIdx && k.n === null && UNITS[k.t])
    const unit = unitIdx >= 0 ? UNITS[toks[unitIdx].t] : ''

    const nameTokens = toks
      .filter((k, i) => k.n === null && i !== unitIdx && !FILLER.has(k.t))
      .map((k) => k.t)
    if (!nameTokens.length && amountIdx === -1 && qtyIdx === -1) continue
    const name = nameTokens.join(' ') || 'Item'

    out.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      qty,
      unit,
      amountPaise: amountIdx >= 0 ? Math.round((toks[amountIdx].n ?? 0) * 100) : null,
    })
  }
  return out
}
