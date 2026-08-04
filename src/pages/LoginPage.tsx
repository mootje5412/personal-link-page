import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

type LoginTab = 'phone' | 'email' | 'username'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<LoginTab>('phone')
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const placeholders: Record<LoginTab, string> = {
    phone: 'Phone number',
    email: 'Email address',
    username: 'Username',
  }

  const inputTypes: Record<LoginTab, string> = {
    phone: 'tel',
    email: 'email',
    username: 'text',
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginValue, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tt-auth">
      <div className="tt-auth-glow tt-glow-cyan" />
      <div className="tt-auth-glow tt-glow-red" />

      <div className="tt-auth-body">
        <div className="tt-logo-wrap">
          <div className="tt-logo">
            <span className="tt-logo-note">♪</span>
          </div>
          <h1 className="tt-brand">Loop</h1>
        </div>

        <h2 className="tt-title">Log in to Loop</h2>

        <div className="tt-tabs">
          {(['phone', 'email', 'username'] as LoginTab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`tt-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setLoginValue('') }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="tt-form">
          {error && <div className="tt-error">{error}</div>}

          <input
            type={inputTypes[tab]}
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder={placeholders[tab]}
            autoComplete="username"
            required
            className="tt-input"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="tt-input"
          />

          <button type="submit" className="tt-btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="tt-divider"><span>or continue with</span></div>

        <div className="tt-social">
          <button type="button" className="tt-social-btn" aria-label="Apple">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          </button>
          <button type="button" className="tt-social-btn" aria-label="Google">
            <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </button>
          <button type="button" className="tt-social-btn" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
        </div>

        <p className="tt-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
