import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Login() {
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
        setMsg('Password reset email sent.')
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
      <p className="text-slate-600">మీ ఖాతా · Your digital credit ledger</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input className="input" type="password" placeholder="Password (min 6)" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        <button className="btn-primary" disabled={busy}>
          {mode === 'login' ? 'Login' : mode === 'register' ? 'Create account' : 'Send reset link'}
        </button>
      </form>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <div className="flex justify-between text-sm text-teal-800 underline">
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New shop? Register' : 'Back to login'}
        </button>
        {mode === 'login' && <button onClick={() => setMode('reset')}>Forgot password?</button>}
      </div>
    </div>
  )
}
