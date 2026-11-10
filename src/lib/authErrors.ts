import type { TFn } from './i18n'

/** Friendly message for a Firebase Auth error, or null if the user simply closed the sign-in window. */
export function authMessage(err: unknown, t: TFn): string | null {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return t('errBadLogin')
    case 'auth/email-already-in-use':
      return t('errEmailInUse')
    case 'auth/weak-password':
      return t('errWeakPassword')
    case 'auth/invalid-email':
      return t('errInvalidEmail')
    case 'auth/network-request-failed':
      return t('errNetwork')
    case 'auth/too-many-requests':
      return t('errTooMany')
    case 'auth/account-exists-with-different-credential':
      return t('errAccountExists')
    case 'auth/unauthorized-domain':
      return t('errDomain')
    case 'auth/operation-not-allowed':
      return t('errNotEnabled')
    default:
      return t('errGeneric')
  }
}
