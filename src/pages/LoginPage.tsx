import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/authApi'
import './AuthPages.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { user, loginSuccess } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(apiKey.trim())
      loginSuccess(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-main">
        <div className="auth-card">
          <h1>Giriş yap</h1>
          <p className="auth-lead">
            Kayıt sırasında aldığınız API anahtarını girin. Anahtar veritabanında şifreli saklanır.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="auth-field">
              <label htmlFor="login-api-key">API anahtarı</label>
              <div className="auth-key-input-wrap">
                <input
                  id="login-api-key"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="vp_xxxxxxxxxxxxxxxx"
                  spellCheck={false}
                  required
                />
                <button
                  type="button"
                  className="auth-key-toggle"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Anahtarı gizle' : 'Anahtarı göster'}
                >
                  {showKey ? 'Gizle' : 'Göster'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn auth-submit" disabled={loading || !apiKey.trim()}>
              {loading ? 'Doğrulanıyor…' : 'Giriş yap'}
            </button>
          </form>

          <p className="auth-footer">
            Hesabın yok mu? <Link to="/kayit">Kayıt ol ve anahtar al</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
