'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LOCKOUT_DURATION_MS = 30 * 60 * 1000
const MAX_ATTEMPTS = 5

/* ─── Logo ─── */
const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 24 30" fill="none" style={{ width: size * 24 / 30, height: size, flexShrink: 0 }} aria-hidden="true">
    <defs>
      <linearGradient id="et-pin-auth" x1="3" y1="1" x2="21" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d475" />
        <stop offset="100%" stopColor="#0d6b35" />
      </linearGradient>
    </defs>
    <path d="M12 1C7.03 1 3 5.03 3 10c0 4.42 3.2 8.22 7.2 13.1L12 29l1.8-5.9C17.8 18.22 21 14.42 21 10c0-4.97-4.03-9-9-9z" fill="url(#et-pin-auth)" style={{ filter: 'drop-shadow(0 3px 8px rgba(13,107,53,0.45))' }} />
    <circle cx="12" cy="10" r="5.5" fill="white" opacity="0.97" />
    <line x1="12" y1="10" x2="9.6" y2="8.6" stroke="#0d6b35" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="15.3" y2="8.1" stroke="#0d6b35" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="10" r="0.9" fill="#0d6b35" />
  </svg>
)

/* ─── Spinner ─── */
const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(237,232,223,0.30)',
    borderTopColor: '#ede8df',
    borderRadius: '50%',
    animation: 'auth-spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
)

/* ─── Email validation ─── */
function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

/* ─── Lockout helpers ─── */
function lockoutKey(email: string) { return `auth_lockout_${email.toLowerCase()}` }

function getLockoutTimestamp(email: string): number | null {
  try { const v = localStorage.getItem(lockoutKey(email)); return v ? parseInt(v, 10) : null } catch { return null }
}
function writeLockout(email: string) {
  try { localStorage.setItem(lockoutKey(email), Date.now().toString()) } catch {}
}
function removeLockout(email: string) {
  try { localStorage.removeItem(lockoutKey(email)) } catch {}
}

/* ─── Error messages ─── */
function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password. Please try again.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.'
  if (msg.includes('User already registered') || msg.includes('already been registered')) return 'An account with this email already exists. Try signing in instead.'
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.'
  if (msg.includes('Unable to validate email address')) return 'Please enter a valid email address.'
  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit') || msg.includes('429')) return 'Too many requests. Please wait a minute before trying again.'
  return msg
}

function isRateLimit(msg: string, status?: number) {
  return status === 429 || msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [focusField, setFocusField] = useState<'email' | 'password' | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Email validation
  const [emailError, setEmailError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  // Lockout
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutEmail, setLockoutEmail] = useState('')
  const [minutesLeft, setMinutesLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Duplicate email (signup)
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false)

  // Forgot password
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'success' | 'ratelimit' | string>('idle')

  /* ── Redirect if already signed in ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/plan')
    })
  }, [])

  /* ── Auto-open forgot panel when reset link expired/invalid ── */
  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback_error') {
      setShowForgot(true)
      setForgotStatus('link_expired')
    }
  }, [searchParams])

  /* ── Lockout: compute remaining minutes ── */
  function computeMinutesLeft(email: string): number {
    const ts = getLockoutTimestamp(email)
    if (!ts) return 0
    const elapsed = Date.now() - ts
    if (elapsed >= LOCKOUT_DURATION_MS) return 0
    return Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 60000)
  }

  function applyLockout(emailVal: string): boolean {
    const ts = getLockoutTimestamp(emailVal)
    if (!ts) { setIsLockedOut(false); return false }
    const elapsed = Date.now() - ts
    if (elapsed >= LOCKOUT_DURATION_MS) { removeLockout(emailVal); setIsLockedOut(false); return false }
    setIsLockedOut(true)
    setLockoutEmail(emailVal)
    setMinutesLeft(Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 60000))
    return true
  }

  /* ── Lockout auto-unlock tick ── */
  useEffect(() => {
    if (!isLockedOut) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      const mins = computeMinutesLeft(lockoutEmail)
      if (mins <= 0) { removeLockout(lockoutEmail); setIsLockedOut(false); clearInterval(timerRef.current!) }
      else setMinutesLeft(mins)
    }, 60000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isLockedOut, lockoutEmail])

  /* ── Re-check lockout when email or mode changes ── */
  useEffect(() => {
    if (mode === 'signin' && email) applyLockout(email)
    else setIsLockedOut(false)
  }, [email, mode])

  /* ── Email blur validation ── */
  function validateOnBlur(val: string) {
    setEmailTouched(true)
    if (!val) { setEmailError(''); return }
    setEmailError(isValidEmail(val) ? '' : 'Please enter a valid email address')
  }

  function handleEmailChange(val: string) {
    setEmail(val)
    setFailedAttempts(0)
    setIsDuplicateEmail(false)
    setError('')
    // Live-validate only after user has already blurred once
    if (emailTouched) {
      setEmailError(val && !isValidEmail(val) ? 'Please enter a valid email address' : '')
    }
  }

  /* ── Main submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsDuplicateEmail(false)

    if (!isValidEmail(email)) {
      setEmailTouched(true)
      setEmailError('Please enter a valid email address')
      return
    }

    if (mode === 'signin' && applyLockout(email)) return

    setLoading(true)

    if (mode === 'signin') {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        if (isRateLimit(signInErr.message, signInErr.status)) {
          setError('Too many requests. Please wait a minute before trying again.')
        } else {
          const next = failedAttempts + 1
          setFailedAttempts(next)
          if (next >= MAX_ATTEMPTS) {
            writeLockout(email)
            setIsLockedOut(true)
            setLockoutEmail(email)
            setMinutesLeft(30)
            await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
            })
          } else {
            setError(friendlyError(signInErr.message))
          }
        }
      } else {
        setFailedAttempts(0)
        removeLockout(email)
        router.replace('/plan')
      }
    } else {
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) {
        if (isRateLimit(signUpErr.message, signUpErr.status)) {
          setError('Too many requests. Please wait a minute before trying again.')
        } else if (signUpErr.message.includes('User already registered') || signUpErr.message.includes('already been registered')) {
          setIsDuplicateEmail(true)
        } else {
          setError(friendlyError(signUpErr.message))
        }
      } else {
        const user = data?.user
        // Detect duplicate: Supabase "fake success" for existing emails.
        // Behavior varies by project config — identities may be empty OR populated.
        // created_at is the reliable signal: a real new account is always <10s old.
        const justCreated = user?.created_at
          ? Date.now() - new Date(user.created_at).getTime() < 10000
          : false
        const hasIdentity = (user?.identities?.length ?? 0) > 0

        if (!user || !justCreated || !hasIdentity) {
          setIsDuplicateEmail(true)
        } else {
          setSuccess('Account created! Check your email to confirm, then sign in.')
          setMode('signin')
          setPassword('')
        }
      }
    }

    setLoading(false)
  }

  /* ── Forgot password submit ── */
  async function handleForgotSubmit() {
    setForgotLoading(true)
    setForgotStatus('idle')
    const target = forgotEmail || email
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    })
    if (error) {
      setForgotStatus(isRateLimit(error.message, error.status) ? 'ratelimit' : `err:${friendlyError(error.message)}`)
    } else {
      setForgotStatus('success')
    }
    setForgotLoading(false)
  }

  /* ── Mode switch ── */
  function switchMode(next?: 'signin' | 'signup') {
    setMode(next ?? (mode === 'signin' ? 'signup' : 'signin'))
    setError('')
    setSuccess('')
    setIsDuplicateEmail(false)
    setShowForgot(false)
    setForgotStatus('idle')
    setEmailError('')
    setEmailTouched(false)
    setFailedAttempts(0)
  }

  const formDisabled = isLockedOut || loading
  const submitDisabled = formDisabled || (emailTouched && !!emailError)

  /* ─────────────────────── Render ─────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060908',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,13,9,0.97) inset !important;
          -webkit-text-fill-color: #ede8df !important;
          caret-color: #ede8df;
          border-color: rgba(255,255,255,0.09) !important;
        }
      `}</style>

      {/* Atmospheric glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(18,80,42,0.18) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(200,145,58,0.05) 0%, transparent 60%)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }}>
        <filter id="grain-auth">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-auth)" />
      </svg>

      {/* Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        background: 'rgba(8,13,9,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '44px 40px 40px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}>
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: '1.5px solid rgba(200,145,58,0.22)', borderLeft: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '3px 0 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTop: '1.5px solid rgba(200,145,58,0.22)', borderRight: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 3px 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottom: '1.5px solid rgba(200,145,58,0.22)', borderLeft: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 0 0 3px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: '1.5px solid rgba(200,145,58,0.22)', borderRight: '1.5px solid rgba(200,145,58,0.22)', borderRadius: '0 0 3px 0', pointerEvents: 'none' }} />

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36, justifyContent: 'center' }}>
          <LogoIcon size={34} />
          <span style={{ fontWeight: 700, fontSize: 22, color: '#ede8df', letterSpacing: '-0.025em' }}>Easy Trip</span>
        </a>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: 4,
          marginBottom: 32,
          gap: 4,
        }}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 13.5,
                fontWeight: 600,
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                background: mode === m ? 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)' : 'transparent',
                color: mode === m ? '#ede8df' : 'rgba(237,232,223,0.38)',
                boxShadow: mode === m ? '0 2px 12px rgba(18,90,54,0.32)' : 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ede8df', letterSpacing: '-0.025em', marginBottom: 6, lineHeight: 1.2 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ fontSize: 13.5, color: 'rgba(237,232,223,0.44)', marginBottom: 28, lineHeight: 1.6 }}>
          {mode === 'signin' ? 'Sign in to access your saved trips.' : 'Start planning your next American adventure.'}
        </p>

        {/* ── Lockout banner ── */}
        {isLockedOut && (
          <div style={{
            background: 'rgba(220,50,50,0.10)',
            border: '1px solid rgba(220,50,50,0.28)',
            borderRadius: 9,
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: '#f87171', marginTop: 2 }}>
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: 13.5, color: '#fca5a5', lineHeight: 1.6 }}>
              Too many failed attempts. Your account has been temporarily locked. A password reset email has been sent to{' '}
              <strong style={{ color: '#f87171' }}>{lockoutEmail}</strong>.
              {minutesLeft > 0 && ` Unlocks in ~${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`}
            </span>
          </div>
        )}

        {/* ── Error ── */}
        {error && !isLockedOut && (
          <div style={{
            background: 'rgba(220,50,50,0.10)',
            border: '1px solid rgba(220,50,50,0.28)',
            borderRadius: 9,
            padding: '11px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: '#f87171', marginTop: 1 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: 13.5, color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* ── Duplicate email (signup) ── */}
        {isDuplicateEmail && (
          <div style={{
            background: 'rgba(200,145,58,0.10)',
            border: '1px solid rgba(200,145,58,0.30)',
            borderRadius: 9,
            padding: '11px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: '#fbbf24', marginTop: 1 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: 13.5, color: '#fcd34d', lineHeight: 1.5 }}>
              Looks like you already have an account with this email.{' '}
              <button
                onClick={() => switchMode('signin')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#34d475', fontWeight: 600, fontSize: 13.5,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px',
                }}
              >
                Head to the login page instead!
              </button>
            </span>
          </div>
        )}

        {/* ── Success ── */}
        {success && (
          <div style={{
            background: 'rgba(30,138,82,0.12)',
            border: '1px solid rgba(52,212,117,0.30)',
            borderRadius: 9,
            padding: '11px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: '#34d475', marginTop: 1 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: 13.5, color: '#86efac', lineHeight: 1.5 }}>{success}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email field */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(237,232,223,0.52)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              onFocus={() => setFocusField('email')}
              onBlur={e => { setFocusField(null); validateOnBlur(e.target.value) }}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={loading}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${emailTouched && emailError ? 'rgba(220,50,50,0.50)' : focusField === 'email' ? 'rgba(52,212,117,0.50)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 10,
                padding: '13px 16px',
                fontSize: 15,
                color: '#ede8df',
                outline: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: 'border-color 0.2s ease, background 0.2s ease',
                boxSizing: 'border-box',
                boxShadow: emailTouched && emailError ? '0 0 0 3px rgba(220,50,50,0.08)' : focusField === 'email' ? '0 0 0 3px rgba(52,212,117,0.08)' : 'none',
                cursor: loading ? 'not-allowed' : 'text',
              }}
            />
            {emailTouched && emailError && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 6, lineHeight: 1.4, marginBottom: 0 }}>{emailError}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(237,232,223,0.52)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                disabled={isLockedOut}
                style={{
                  width: '100%',
                  background: isLockedOut ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${focusField === 'password' ? 'rgba(52,212,117,0.50)' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10,
                  padding: '13px 48px 13px 16px',
                  fontSize: 15,
                  color: isLockedOut ? 'rgba(237,232,223,0.30)' : '#ede8df',
                  outline: 'none',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                  boxShadow: focusField === 'password' ? '0 0 0 3px rgba(52,212,117,0.08)' : 'none',
                  cursor: isLockedOut ? 'not-allowed' : 'text',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(8,13,9,0.85)', border: 'none', cursor: 'pointer', padding: 4,
                  borderRadius: 6,
                  color: showPassword ? 'rgba(52,212,117,0.85)' : 'rgba(237,232,223,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: showPassword ? 'rgba(52,212,117,0.95)' : 'rgba(237,232,223,0.60)' })}
                onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: showPassword ? 'rgba(52,212,117,0.70)' : 'rgba(237,232,223,0.30)' })}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* ── Forgot password link ── */}
            {mode === 'signin' && (
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(v => !v); setForgotEmail(email); setForgotStatus('idle') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(237,232,223,0.38)', fontSize: 12.5,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.65)' })}
                  onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.38)' })}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* ── Forgot password inline panel ── */}
            {showForgot && mode === 'signin' && (
              <div style={{
                marginTop: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {forgotStatus === 'link_expired' ? (
                  <p style={{ fontSize: 12.5, color: '#fcd34d', lineHeight: 1.5, margin: 0 }}>
                    Your reset link has expired or was already used. Enter your email to get a new one.
                  </p>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'rgba(237,232,223,0.50)', lineHeight: 1.5, margin: 0 }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                )}
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => { setForgotEmail(e.target.value); if (forgotStatus === 'link_expired') setForgotStatus('idle') }}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13.5,
                    color: '#ede8df',
                    outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={handleForgotSubmit}
                  disabled={forgotLoading}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: '#ede8df',
                    background: forgotLoading ? 'rgba(30,107,66,0.45)' : 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
                    border: '1px solid rgba(46,140,88,0.38)',
                    borderRadius: 8,
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: forgotLoading ? 0.7 : 1,
                  }}
                >
                  {forgotLoading ? <><Spinner /> Sending…</> : 'Send Reset Email'}
                </button>
                {forgotStatus === 'success' && (
                  <p style={{ fontSize: 12.5, color: '#86efac', lineHeight: 1.5, margin: 0 }}>
                    Password reset email sent! Check your inbox.
                  </p>
                )}
                {forgotStatus === 'ratelimit' && (
                  <p style={{ fontSize: 12.5, color: '#f87171', lineHeight: 1.5, margin: 0 }}>
                    Too many requests. Please wait a minute before trying again.
                  </p>
                )}
                {forgotStatus.startsWith('err:') && (
                  <p style={{ fontSize: 12.5, color: '#f87171', lineHeight: 1.5, margin: 0 }}>
                    {forgotStatus.slice(4)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Submit button ── */}
          <button
            type="submit"
            disabled={submitDisabled}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '14px',
              fontSize: 15,
              fontWeight: 600,
              color: '#ede8df',
              background: submitDisabled ? 'rgba(30,107,66,0.45)' : 'linear-gradient(135deg, #1e6b42 0%, #0e4428 100%)',
              border: '1px solid rgba(46,140,88,0.38)',
              borderRadius: 10,
              cursor: submitDisabled ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: '-0.01em',
              transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: submitDisabled ? 'none' : '0 4px 24px rgba(18,90,54,0.38)',
              opacity: submitDisabled ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => { if (!submitDisabled) Object.assign((e.currentTarget as HTMLElement).style, { transform: 'translateY(-1px)', boxShadow: '0 6px 32px rgba(18,90,54,0.54)' }) }}
            onMouseLeave={e => { if (!submitDisabled) Object.assign((e.currentTarget as HTMLElement).style, { transform: 'translateY(0)', boxShadow: '0 4px 24px rgba(18,90,54,0.38)' }) }}
          >
            {loading ? (
              <><Spinner />{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'rgba(237,232,223,0.38)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#34d475', fontWeight: 600, fontSize: 13.5,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px',
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Back to home */}
      <a href="/" style={{ marginTop: 24, fontSize: 13, color: 'rgba(237,232,223,0.28)', textDecoration: 'none', transition: 'color 0.2s ease' }}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.60)' })}
        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { color: 'rgba(237,232,223,0.28)' })}
      >
        ← Back to home
      </a>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        Loading...
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
