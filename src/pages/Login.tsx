import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useLang } from '../lib/langContext'

export default function Login() {
  const { t, lang, setLang } = useLang()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password)
      else if (mode === 'register') await createUserWithEmailAndPassword(auth, email, password)
      else {
        await sendPasswordResetEmail(auth, email)
        setMsg(t('resetSent'))
      }
    } catch (err) {
      setMsg((err as Error).message.replace('Firebase: ', ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold text-teal-800">Apna Khata</h1>
      <p className="text-slate-600">{t('loginTagline')}</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" type="email" placeholder={t('email')} required value={email}
          onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input className="input" type="password" placeholder={t('password')} required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        <button className="btn-primary" disabled={busy}>
          {mode === 'login' ? t('login') : mode === 'register' ? t('createAccount') : t('sendReset')}
        </button>
      </form>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <div className="flex justify-between text-sm text-teal-800 underline">
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? t('newShop') : t('backToLogin')}
        </button>
        {mode === 'login' && <button onClick={() => setMode('reset')}>{t('forgot')}</button>}
      </div>
      <button className="self-start text-sm text-slate-600 underline" onClick={() => setLang(lang === 'en' ? 'te' : 'en')}>
        {lang === 'en' ? 'తెలుగు' : 'English'}
      </button>
    </div>
  )
}
