interface Alt { transcript: string }
interface Res { isFinal: boolean; 0: Alt }
interface Ev { results: { length: number; [i: number]: Res } }
interface Recognizer {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: Ev) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type Ctor = new () => Recognizer

function getCtor(): Ctor | undefined {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const voiceSupported = () => !!getCtor()

/** Thin adapter over the browser Speech Recognition API (no custom engine). */
export function createRecognizer(
  lang: string,
  h: { onLive: (text: string) => void; onEnd: (text: string) => void; onError: (code: string) => void },
) {
  const Ctor = getCtor()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = lang
  r.continuous = true
  r.interimResults = true
  let last = ''
  r.onresult = (e) => {
    let t = ''
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' '
    last = t.trim()
    h.onLive(last)
  }
  r.onerror = (e) => h.onError(e.error)
  r.onend = () => h.onEnd(last)
  return r
}
