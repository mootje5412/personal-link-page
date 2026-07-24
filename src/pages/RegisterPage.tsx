import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/authApi'
import './AuthPages.css'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { user, loginSuccess } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(username.trim(), password, email.trim() || undefined)
      loginSuccess(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-main">
        <div className="auth-card">
          <h1>Kayıt ol</h1>
          <p className="auth-lead">Kullanıcı adı ve şifre ile hesap oluştur. E-posta isteğe bağlı.</p>

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

            <div className="auth-field">
              <label htmlFor="register-password">Şifre</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                minLength={8}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                E-posta <span>(isteğe bağlı)</span>
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Hesap oluştur'}
            </button>
          </form>

          <p className="auth-footer">
            Zaten hesabın var mı? <Link to="/giris">Giriş yap</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
