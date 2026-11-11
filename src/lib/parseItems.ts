export interface ParsedItem { name: string; qty: number; unit: string; amountPaise: number | null }

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
  g: 'g', gm: 'g', gram: 'g', grams: 'g', litre: 'litre', litres: 'litre', liter: 'litre',
  liters: 'litre', ltr: 'litre', l: 'litre', packet: 'packet', packets: 'packet', pkt: 'packet',
  piece: 'pcs', pieces: 'pcs', pc: 'pcs', pcs: 'pcs', dozen: 'dozen', bottle: 'bottle',
  bottles: 'bottle', box: 'box', boxes: 'box', bag: 'bag', bags: 'bag',
  కిలో: 'kg', కిలోలు: 'kg', కిలోల: 'kg', కేజీ: 'kg', కేజీలు: 'kg', కేజీల: 'kg',
  గ్రాము: 'g', గ్రాములు: 'g', గ్రాముల: 'g', లీటర్: 'litre', లీటరు: 'litre',
  లీటర్లు: 'litre', లీటర్ల: 'litre', ప్యాకెట్: 'packet', ప్యాకెట్లు: 'packet',
  ప్యాకెట్ల: 'packet', డజను: 'dozen', డజన్: 'dozen', సీసా: 'bottle', సీసాలు: 'bottle',
}
const FILLER = new Set(['of', 'rupees', 'rupee', 'rs', 'inr', 'రూపాయలు', 'రూపాయి', 'రూపాయల', 'రూ'])
const TELUGU_DIGITS = '౦౧౨౩౪౫౬౭౮౯'
const isDigit = (token: string) => /^\d+(\.\d+)?$/.test(token)
interface Token { text: string; value: number | null; wordNumber: boolean }

function combineNumbers(values: number[]): number {
  let total = 0, current = 0
  for (const value of values) {
    if (value === 100) current = (current || 1) * 100
    else if (value === 1000) { total += (current || 1) * 1000; current = 0 }
    else current += value
  }
  return total + current
}

function tokenize(words: string[]): Token[] {
  const result: Token[] = []
  for (let i = 0; i < words.length;) {
    if (isDigit(words[i])) { result.push({ text: words[i], value: Number(words[i]), wordNumber: false }); i++; continue }
    if (NUM_WORDS[words[i]] !== undefined) {
      let j = i
      const values: number[] = []
      while (j < words.length && !isDigit(words[j]) && NUM_WORDS[words[j]] !== undefined) values.push(NUM_WORDS[words[j++]])
      if (values.every(Number.isInteger)) result.push({ text: words.slice(i, j).join(' '), value: combineNumbers(values), wordNumber: true })
      else for (let k = i; k < j; k++) result.push({ text: words[k], value: NUM_WORDS[words[k]], wordNumber: true })
      i = j; continue
    }
    result.push({ text: words[i], value: null, wordNumber: false }); i++
  }
  return result
}

/** Parses common shop phrases. Unclear or incomplete values stay blank for the owner to check. */
export function parseItems(input: string): ParsedItem[] {
  const normalized = input.toLowerCase().replace(/[౦-౯]/g, (digit) => String(TELUGU_DIGITS.indexOf(digit)))
  const segments = normalized.split(/[,;\n]+|\s+and\s+|\s+then\s+|\s+మరియు\s+|\s+ఇంకా\s+/)
  const parsed: ParsedItem[] = []
  for (const segment of segments) {
    const cleaned = segment.replace(/₹/g, ' ').replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/[^\p{L}\p{M}\p{N}.\s]/gu, ' ')
    const words = cleaned.split(/\s+/).map((word) => word.replace(/^\.+|\.+$/g, '')).filter(Boolean)
    if (!words.length || words[0] === 'total' || words[0] === 'మొత్తం') continue
    const tokens = tokenize(words)
    const numberIndexes = tokens.map((token, index) => token.value !== null ? index : -1).filter((index) => index >= 0)
    let amountIndex = -1, quantityIndex = -1
    if (numberIndexes.length >= 2) { quantityIndex = numberIndexes[0]; amountIndex = numberIndexes[numberIndexes.length - 1] }
    else if (numberIndexes.length === 1) {
      const index = numberIndexes[0]
      if (UNITS[tokens[index + 1]?.text] || (tokens[index].wordNumber && (tokens[index].value ?? 0) <= 20)) quantityIndex = index
      else amountIndex = index
    }
    const quantity = quantityIndex >= 0 ? tokens[quantityIndex].value : 1
    if (quantity === null || quantity <= 0 || !Number.isFinite(quantity)) continue
    const unitIndex = tokens.findIndex((token, index) => index !== quantityIndex && index !== amountIndex && token.value === null && UNITS[token.text])
    const unit = unitIndex >= 0 ? UNITS[tokens[unitIndex].text] : ''
    const name = tokens.filter((token, index) => token.value === null && index !== unitIndex && !FILLER.has(token.text)).map((token) => token.text).join(' ').trim()
    if (!name) continue
    const amount = amountIndex >= 0 ? tokens[amountIndex].value : null
    const amountPaise = amount !== null && Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Math.round(amount * 100)) ? Math.round(amount * 100) : null
    parsed.push({ name: name.charAt(0).toUpperCase() + name.slice(1), qty: Math.round(quantity * 100) / 100, unit, amountPaise })
  }
  return parsed
}
