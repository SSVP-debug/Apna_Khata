import { describe, expect, it } from 'vitest'
import { authMessage } from './authErrors'
import { translate } from './i18n'

const t = (k: Parameters<typeof translate>[1]) => translate('en', k)

describe('authMessage', () => {
  it('ignores a closed Google window', () => {
    expect(authMessage({ code: 'auth/popup-closed-by-user' }, t)).toBeNull()
  })
  it('maps common errors to simple messages', () => {
    expect(authMessage({ code: 'auth/invalid-credential' }, t)).toBe('Wrong email or password.')
    expect(authMessage({ code: 'auth/network-request-failed' }, t)).toContain('No internet')
    expect(authMessage({ code: 'auth/unauthorized-domain' }, t)).toContain('Firebase')
  })
  it('falls back to a generic message', () => {
    expect(authMessage(new Error('boom'), t)).toBe('Login failed. Please try again.')
  })
})
