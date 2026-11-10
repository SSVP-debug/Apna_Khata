import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { authMessage } from '../lib/authErrors'
import { useLang } from '../lib/langContext'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function Login() {
  const { t, lang, setLang } = useLang()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // Finishes a Google sign-in that used the redirect fallback (e.g. when pop-ups are blocked).
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      const m = authMessage(err, t)
      if (m) setMsg(m)
    })
  }, [t])

  async function google() {
    setBusy(true)
    setMsg('')
    setInfo('')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (e) {
          const m = authMessage(e, t)
          if (m) setMsg(m)
        }
      } else {
        const m = authMessage(err, t)
        if (m) setMsg(m)
      }
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setInfo('')
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password)
      else if (mode === 'register') await createUserWithEmailAndPassword(auth, email, password)
      else {
        await sendPasswordResetEmail(auth, email)
        setInfo(t('resetSent'))
      }
    } catch (err) {
      const m = authMessage(err, t)
      if (m) setMsg(m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold text-teal-800">Apna Khata</h1>
      <p className="text-slate-600">{t('loginTagline')}</p>

      {mode !== 'reset' && (
        <>
          <button type="button" onClick={google} disabled={busy}
            className="flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 shadow-sm active:scale-95 disabled:opacity-50">
            <GoogleLogo />
            {t('continueGoogle')}
          </button>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-300" />{t('orEmail')}<span className="h-px flex-1 bg-slate-300" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" type="email" placeholder={t('email')} required value={email} autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input className="input" type="password" placeholder={t('password')} required minLength={6} value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onChange={(e) => setPassword(e.target.value)} />
        )}
        <button className="btn-primary" disabled={busy}>
          {mode === 'login' ? t('login') : mode === 'register' ? t('createAccount') : t('sendReset')}
        </button>
      </form>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      {info && <p className="text-sm text-green-800">{info}</p>}
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
