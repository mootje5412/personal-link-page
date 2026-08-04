import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthday, setBirthday] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!username || !displayName) {
        setError('Username and display name are required.')
        return
      }
      setError('')
      setStep(2)
      return
    }

    setError('')
    setLoading(true)
    try {
      await register({
        username: username.toLowerCase(),
        displayName,
        email: email || undefined,
        phone: phone || undefined,
        password,
      })
      navigate('/create')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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

        <h2 className="tt-title">Sign up for Loop</h2>
        <p className="tt-step-label">Step {step} of 2</p>

        <form onSubmit={handleSubmit} className="tt-form">
          {error && <div className="tt-error">{error}</div>}

          {step === 1 && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                placeholder="Username"
                required
                minLength={3}
                maxLength={24}
                className="tt-input"
              />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                required
                maxLength={50}
                className="tt-input"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="tt-input"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="tt-input"
              />
              <button type="submit" className="tt-btn-primary">Next</button>
            </>
          )}

          {step === 2 && (
            <>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="tt-input tt-input-date"
              />
              <p className="tt-hint">Your birthday won&apos;t be shown publicly.</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                required
                minLength={6}
                className="tt-input"
              />
              <p className="tt-terms">
                By continuing, you agree to Loop&apos;s Terms of Service and Privacy Policy.
              </p>
              <button type="submit" className="tt-btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
              <button type="button" className="tt-btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
            </>
          )}
        </form>

        <p className="tt-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
