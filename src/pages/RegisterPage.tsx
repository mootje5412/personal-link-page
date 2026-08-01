import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import ApiKeyReveal from '../components/ApiKeyReveal'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/authApi'
import './AuthPages.css'

const TERMS_TEXT = `
VeriPanel kullanım şartları:

1. Hesabınız size özel API anahtarı ile korunur. Anahtarınızı güvenli tutmak sizin sorumluluğunuzdadır.
2. Platform yalnızca yasal ve yetkili amaçlarla kullanılmalıdır.
3. Sorgu limitleri paketinize göre uygulanır.
4. Kötüye kullanım tespit edildiğinde hesap askıya alınabilir.
5. API anahtarları scrypt ile hashlenerek SQL veritabanında saklanır — düz metin tutulmaz.
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

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Devam etmek için kullanım şartlarını kabul etmelisiniz.')
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
    navigate('/')
  }

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-main">
        <div className="auth-card">
          {issuedKey ? (
            <ApiKeyReveal apiKey={issuedKey} onContinue={handleKeySaved} />
          ) : (
            <>
              <h1>Kayıt ol</h1>
              <p className="auth-lead">
                Sadece kullanıcı adı seçin. Size özel bir API anahtarı oluşturulur — şifre veya e-posta gerekmez.
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <p className="auth-error" role="alert">{error}</p>}

                <div className="auth-field">
                  <label htmlFor="register-username">Kullanıcı adı</label>
                  <input
                    id="register-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kullanici_adi"
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_]+"
                    required
                  />
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
                  {loading ? 'Anahtar oluşturuluyor…' : 'Anahtar oluştur'}
                </button>
              </form>

              <p className="auth-footer">
                Zaten hesabın var mı? <Link to="/giris">API anahtarı ile giriş</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
