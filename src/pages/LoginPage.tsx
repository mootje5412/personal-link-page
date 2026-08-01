import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import AuthBrand from '../components/AuthBrand'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/authApi'
import { validateApiKey } from '../services/validation'
import './AuthPages.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { user, loginSuccess } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)

  if (user) return <Navigate to="/panel" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const keyError = validateApiKey(apiKey)
    if (keyError) {
      setError(keyError)
      return
    }

    setLoading(true)
    try {
      const data = await login(apiKey.trim())
      loginSuccess(data.user, data.token)
      navigate('/panel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-shell">
        <AuthBrand
          title="Anahtar ile giriş"
          subtitle="Kayıt olurken aldığın vp_ anahtarını gir. Şifre veya e-posta kullanılmaz."
        />

        <div className="auth-panel">
          <div className="auth-card">
            <h1>Giriş yap</h1>
            <p className="auth-lead">
              <strong>API anahtarını</strong> gir. Anahtarın şifreli olarak güvenle saklanır.
            </p>

            <div className="auth-key-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
                <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.75" />
              </svg>
              Sadece API anahtarı — şifre yok
            </div>

            <form className="auth-form" noValidate onSubmit={handleSubmit}>
              {error && <p className="auth-error" role="alert">{error}</p>}

              <div className="auth-field">
                <label htmlFor="login-api-key">API anahtarı</label>
                <div className="auth-key-input-wrap">
                  <input
                    id="login-api-key"
                    type={showKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value.trimStart())}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pasted = e.clipboardData.getData('text').trim()
                      setApiKey(pasted)
                    }}
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
                <p className="auth-field-hint">Kayıt sırasında aldığınız vp_ ile başlayan anahtar</p>
              </div>

              <button type="submit" className="btn auth-submit" disabled={loading || !apiKey.trim()}>
                {loading ? 'Doğrulanıyor…' : 'Giriş yap'}
              </button>
            </form>

            <p className="auth-footer">
              Hesabın yok mu? <Link to="/kayit">Kayıt ol ve anahtar al</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
