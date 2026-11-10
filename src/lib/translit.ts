// Offline English <-> Telugu transliteration for customer names.
// Common names come from a dictionary; anything else uses approximate rules. Owners can edit the result.

const NAMES: [string, string][] = [
  ['ramesh', 'రమేష్'], ['suresh', 'సురేష్'], ['mahesh', 'మహేష్'], ['naresh', 'నరేష్'], ['ganesh', 'గణేష్'],
  ['rajesh', 'రాజేష్'], ['dinesh', 'దినేష్'], ['umesh', 'ఉమేష్'], ['venkatesh', 'వెంకటేష్'], ['satish', 'సతీష్'],
  ['mallesh', 'మల్లేష్'], ['nagesh', 'నాగేష్'], ['rakesh', 'రాకేష్'], ['ravi', 'రవి'], ['raju', 'రాజు'],
  ['kumar', 'కుమార్'], ['prasad', 'ప్రసాద్'], ['anil', 'అనిల్'], ['sunil', 'సునీల్'], ['kiran', 'కిరణ్'],
  ['mohan', 'మోహన్'], ['krishna', 'కృష్ణ'], ['lakshmi', 'లక్ష్మి'], ['srinivas', 'శ్రీనివాస్'], ['srinivasa', 'శ్రీనివాస'],
  ['venkat', 'వెంకట్'], ['venkata', 'వెంకట'], ['rao', 'రావు'], ['reddy', 'రెడ్డి'], ['naidu', 'నాయుడు'],
  ['sharma', 'శర్మ'], ['devi', 'దేవి'], ['rani', 'రాణి'], ['sita', 'సీత'], ['anitha', 'అనిత'], ['sunitha', 'సునీత'],
  ['kavitha', 'కవిత'], ['sridevi', 'శ్రీదేవి'], ['padma', 'పద్మ'], ['saraswathi', 'సరస్వతి'], ['parvathi', 'పార్వతి'],
  ['lalitha', 'లలిత'], ['radha', 'రాధ'], ['rama', 'రామ'], ['hari', 'హరి'], ['shiva', 'శివ'], ['sai', 'సాయి'],
  ['balaji', 'బాలాజీ'], ['nagaraju', 'నాగరాజు'], ['narayana', 'నారాయణ'], ['subbarao', 'సుబ్బారావు'], ['murthy', 'మూర్తి'],
  ['chandra', 'చంద్ర'], ['chandrasekhar', 'చంద్రశేఖర్'], ['ramu', 'రాము'], ['ramana', 'రమణ'], ['ravindra', 'రవీంద్ర'],
  ['mahender', 'మహేందర్'], ['rajendra', 'రాజేంద్ర'], ['vijay', 'విజయ్'], ['ajay', 'అజయ్'], ['sanjay', 'సంజయ్'],
  ['anand', 'ఆనంద్'], ['ashok', 'అశోక్'], ['bhaskar', 'భాస్కర్'], ['gopal', 'గోపాల్'], ['gopi', 'గోపి'],
  ['madhu', 'మధు'], ['manoj', 'మనోజ్'], ['naveen', 'నవీన్'], ['pavan', 'పవన్'], ['praveen', 'ప్రవీణ్'],
  ['ramakrishna', 'రామకృష్ణ'], ['rohit', 'రోహిత్'], ['sandeep', 'సందీప్'], ['srikanth', 'శ్రీకాంత్'], ['srinu', 'శ్రీను'],
  ['sudhakar', 'సుధాకర్'], ['surya', 'సూర్య'], ['swamy', 'స్వామి'], ['vamsi', 'వంశీ'], ['vinod', 'వినోద్'],
  ['yadav', 'యాదవ్'], ['yadagiri', 'యాదగిరి'], ['jyothi', 'జ్యోతి'], ['swapna', 'స్వప్న'], ['sravani', 'శ్రావణి'],
  ['divya', 'దివ్య'], ['deepika', 'దీపిక'], ['geetha', 'గీత'], ['sandhya', 'సంధ్య'], ['uma', 'ఉమ'], ['vani', 'వాణి'],
  ['vijaya', 'విజయ'], ['bharathi', 'భారతి'], ['pushpa', 'పుష్ప'], ['shobha', 'శోభ'], ['sirisha', 'శిరీష'],
  ['anjali', 'అంజలి'], ['aruna', 'అరుణ'], ['ramya', 'రమ్య'], ['mounika', 'మౌనిక'], ['haritha', 'హరిత'], ['usha', 'ఉష'],
  ['latha', 'లత'], ['vasantha', 'వసంత'], ['swathi', 'స్వాతి'], ['malleswari', 'మల్లేశ్వరి'], ['nagamani', 'నాగమణి'],
  ['sathish', 'సతీష్'], ['laxmi', 'లక్ష్మి'], ['geeta', 'గీత'], ['sreenivas', 'శ్రీనివాస్'], ['sri', 'శ్రీ'],
]

const EN_TO_TE = new Map(NAMES)
const TE_TO_EN = new Map<string, string>()
for (const [en, te] of NAMES) if (!TE_TO_EN.has(te)) TE_TO_EN.set(te, en)

export const hasTelugu = (s: string) => /[\u0C00-\u0C7F]/.test(s)
const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)

// ---------- Telugu -> English ----------
const T_CONS: Record<string, string> = {
  క: 'k', ఖ: 'kh', గ: 'g', ఘ: 'gh', ఙ: 'ng', చ: 'ch', ఛ: 'chh', జ: 'j', ఝ: 'jh', ఞ: 'ny',
  ట: 't', ఠ: 'th', డ: 'd', ఢ: 'dh', ణ: 'n', త: 't', థ: 'th', ద: 'd', ధ: 'dh', న: 'n',
  ప: 'p', ఫ: 'ph', బ: 'b', భ: 'bh', మ: 'm', య: 'y', ర: 'r', ఱ: 'r', ల: 'l', ళ: 'l', వ: 'v',
  శ: 'sh', ష: 'sh', స: 's', హ: 'h',
}
const T_IND: Record<string, string> = {
  అ: 'a', ఆ: 'a', ఇ: 'i', ఈ: 'i', ఉ: 'u', ఊ: 'u', ఋ: 'ru', ఎ: 'e', ఏ: 'e', ఐ: 'ai', ఒ: 'o', ఓ: 'o', ఔ: 'au',
}
const T_MATRA: Record<string, string> = {
  'ా': 'a', 'ి': 'i', 'ీ': 'i', 'ు': 'u', 'ూ': 'u', 'ృ': 'ri', 'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au',
}
const VIRAMA = '్'
const ANUSVARA = 'ం'

function wordTeToEn(w: string): string {
  const dict = TE_TO_EN.get(w)
  if (dict) return dict
  let out = ''
  const chars = [...w]
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    const next = chars[i + 1]
    if (T_CONS[c] !== undefined) {
      out += T_CONS[c]
      if (next === VIRAMA) { i++; continue }
      if (next && T_MATRA[next] !== undefined) { out += T_MATRA[next]; i++; continue }
      out += 'a'
    } else if (T_IND[c] !== undefined) out += T_IND[c]
    else if (c === ANUSVARA) out += next && 'మపబభ'.includes(next) ? 'm' : next ? 'n' : 'm'
    else if (c === 'ః') out += 'h'
    else if (c === 'ఁ') out += 'n'
    else if (T_MATRA[c] !== undefined) out += T_MATRA[c]
    else if (c !== VIRAMA) out += c
  }
  return out
}

export function teToEn(name: string): string {
  return name.split(/(\s+)/).map((p) => (/^\s+$/.test(p) || !p ? p : cap(wordTeToEn(p)))).join('')
}

// ---------- English -> Telugu (rule fallback) ----------
const E_CONS: [string, string][] = [
  ['chh', 'ఛ'], ['ch', 'చ'], ['kh', 'ఖ'], ['gh', 'ఘ'], ['jh', 'ఝ'], ['th', 'త'], ['dh', 'ధ'], ['ph', 'ఫ'], ['bh', 'భ'], ['sh', 'ష'],
  ['k', 'క'], ['g', 'గ'], ['c', 'క'], ['j', 'జ'], ['t', 'త'], ['d', 'ద'], ['n', 'న'], ['p', 'ప'], ['b', 'బ'], ['m', 'మ'],
  ['y', 'య'], ['r', 'ర'], ['l', 'ల'], ['v', 'వ'], ['w', 'వ'], ['s', 'స'], ['h', 'హ'], ['f', 'ఫ'], ['z', 'జ'], ['q', 'క'],
]
// [latin, matra, independent]
const E_VOW: [string, string, string][] = [
  ['aa', 'ా', 'ఆ'], ['ai', 'ై', 'ఐ'], ['au', 'ౌ', 'ఔ'], ['ee', 'ీ', 'ఈ'], ['ii', 'ీ', 'ఈ'], ['oo', 'ూ', 'ఊ'], ['uu', 'ూ', 'ఊ'],
  ['a', '', 'అ'], ['e', 'ె', 'ఎ'], ['i', 'ి', 'ఇ'], ['o', 'ో', 'ఓ'], ['u', 'ు', 'ఉ'],
]

export function ruleEnToTe(word: string): string {
  const w = word.toLowerCase()
  let out = ''
  let afterCons = false
  let i = 0
  while (i < w.length) {
    const rest = w.slice(i)
    const vow = E_VOW.find(([l]) => rest.startsWith(l))
    if (vow) {
      const [l, shortMatra, shortInd] = vow
      const long = l === 'e' && /^(sh|s)$/.test(rest.slice(1)) // "Ramesh" -> రమేష్
      const matra = long ? 'ే' : shortMatra
      const ind = long ? 'ఏ' : shortInd
      out += afterCons ? matra : ind
      afterCons = false
      i += l.length
      continue
    }
    const cons = E_CONS.find(([l]) => rest.startsWith(l))
    if (cons) {
      const [l, te] = cons
      // n/m before a stop consonant -> anusvara (వెంకట, ఆనంద్)
      const after = rest.slice(l.length)
      if (!afterCons && ((l === 'n' && /^[kgcjtdb]/.test(after)) || (l === 'm' && /^[pb]/.test(after)))) {
        out += 'ం'
        i += 1
        continue
      }
      const realTe = l === 'c' && /^[eiy]/.test(after) ? 'స' : te
      if (afterCons) out += VIRAMA
      out += realTe
      afterCons = true
      i += l.length
      continue
    }
    if (afterCons) { out += VIRAMA; afterCons = false }
    out += w[i]
    i++
  }
  if (afterCons) out += VIRAMA // final consonant: రమేష్, కుమార్
  return out
}

export function enToTe(name: string): string {
  return name.split(/(\s+)/).map((p) => {
    if (!p || /^\s+$/.test(p)) return p
    const key = p.toLowerCase().replace(/[^a-z]/g, '')
    return EN_TO_TE.get(key) ?? ruleEnToTe(p)
  }).join('')
}
