import { useEffect, useRef, useState } from 'react'
import { createRecognizer } from '../lib/voice'
import { getVoiceLang } from '../lib/settings'
import { useLang } from '../lib/langContext'

type Rec = ReturnType<typeof createRecognizer>

export default function MicButton({ onText, hint }: { onText: (text: string) => void; hint?: string }) {
  const { t } = useLang()
  const [listening, setListening] = useState(false)
  const [live, setLive] = useState('')
  const [msg, setMsg] = useState('')
  const rec = useRef<Rec>(null)

  useEffect(() => () => rec.current?.stop(), [])

  function toggle() {
    if (listening) {
      rec.current?.stop()
      return
    }
    setMsg('')
    setLive('')
    const r = createRecognizer(getVoiceLang(), {
      onLive: setLive,
      onEnd: (t) => {
        setListening(false)
        setLive('')
        if (t.trim()) onText(t.trim())
      },
      onError: (code) =>
        setMsg(code === 'not-allowed' ? t('micBlocked') : code === 'no-speech' ? t('micNoSpeech') : t('micFail')),
    })
    if (!r) {
      setMsg(t('micUnsupported'))
      return
    }
    rec.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      setMsg(t('micStartFail'))
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={toggle}
        className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white shadow-lg active:scale-95 ${listening ? 'animate-pulse bg-red-600' : 'bg-teal-700'}`}
        aria-label={listening ? 'Stop listening' : 'Start speaking'}>
        🎤
      </button>
      <p className="text-center text-base font-semibold">{listening ? t('micListening') : (hint ?? t('micTap'))}</p>
      {live && <p className="rounded-lg bg-slate-100 p-2 text-center text-slate-700">{live}</p>}
      {msg && <p className="text-center text-sm text-red-700">{msg}</p>}
    </div>
  )
}
