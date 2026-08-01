import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import AuthBrand from '../components/AuthBrand'
import ApiKeyReveal from '../components/ApiKeyReveal'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/authApi'
import { validateUsername } from '../services/validation'
import './AuthPages.css'

const TERMS_TEXT = `
VeriPanel Kullanım Şartları v1.0

1. Hesabınız benzersiz API anahtarı ile korunur. Anahtarınızı güvenli tutmak sizin sorumluluğunuzdadır.
2. Platform yalnızca yasal ve yetkili amaçlarla kullanılmalıdır.
3. Sorgu limitleri paketinize göre uygulanır.
4. Kötüye kullanım tespit edildiğinde hesap askıya alınabilir.
5. API anahtarları güvenli şekilde şifrelenerek saklanır. Düz metin asla tutulmaz.
6. Anahtarınızı kaybederseniz kurtarma mümkün değildir — yeni hesap oluşturmanız gerekir.
`.trim()

const RegisterPage = () => {
  const navigate = useNavigate()
  const { user, loginSuccess } = useAuth()
  const [username, setUsername] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuedKey, setIssuedKey] = useState<string | null>(null)
  const [pendingSession, setPendingSession] = useState<{ user: Parameters<typeof loginSuccess>[0]; token: string } | null>(null)

  if (user) return <Navigate to="/panel" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Devam etmek için kullanım şartlarını kabul etmelisiniz.')
      return
    }

    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    setLoading(true)
    try {
      const data = await register(username.trim(), true)
      setIssuedKey(data.apiKey)
      setPendingSession({ user: data.user, token: data.token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeySaved() {
    if (pendingSession) {
      loginSuccess(pendingSession.user, pendingSession.token)
    }
    navigate('/panel')
  }

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-shell">
        <AuthBrand
          title="Anahtar ile kayıt"
          subtitle="Kullanıcı adını seç, sana özel bir API anahtarı oluşturulsun. Şifre yok, e-posta yok."
        />

        <div className="auth-panel">
          <div className="auth-card">
            {issuedKey ? (
              <ApiKeyReveal apiKey={issuedKey} onContinue={handleKeySaved} />
            ) : (
              <>
                <h1>Kayıt ol</h1>
                <p className="auth-lead">
                  Sadece <strong>kullanıcı adı</strong> yeterli. Sistem otomatik olarak güvenli bir
                  API anahtarı üretir ve şifreli olarak saklar.
                </p>

                <div className="auth-key-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2 4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4Z" stroke="currentColor" strokeWidth="1.75" />
                  </svg>
                  Anahtar tabanlı — şifre gerekmez
                </div>

                <form className="auth-form" noValidate onSubmit={handleSubmit}>
                  {error && <p className="auth-error" role="alert">{error}</p>}

                  <div className="auth-field">
                    <label htmlFor="register-username">Kullanıcı adı</label>
                    <input
                      id="register-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="kullanici_adi"
                      minLength={3}
                      maxLength={32}
                      required
                    />
                    <p className="auth-field-hint">3-32 karakter · harf, rakam ve _</p>
                  </div>

                  <div className="auth-terms">
                    <label className="auth-terms-label">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        required
                      />
                      <span>
                        <button
                          type="button"
                          className="auth-terms-link"
                          onClick={() => setShowTerms((v) => !v)}
                        >
                          Kullanım şartlarını
                        </button>
                        {' '}okudum ve kabul ediyorum.
                      </span>
                    </label>

                    {showTerms && (
                      <div className="auth-terms-box" role="region" aria-label="Kullanım şartları">
                        <pre>{TERMS_TEXT}</pre>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn auth-submit" disabled={loading || !acceptedTerms}>
                    {loading ? 'Anahtar oluşturuluyor…' : 'API anahtarı oluştur'}
                  </button>
                </form>

                <p className="auth-footer">
                  Zaten hesabın var mı? <Link to="/giris">Anahtar ile giriş yap</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
