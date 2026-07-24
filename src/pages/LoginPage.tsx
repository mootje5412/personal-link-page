import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/authApi'
import './AuthPages.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { user, loginSuccess } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username.trim(), password)
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
          <p className="auth-lead">Hesabına giriş yap ve aramaya devam et.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="auth-field">
              <label htmlFor="login-username">Kullanıcı adı</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanici_adi"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Şifre</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
            </button>
          </form>

          <p className="auth-footer">
            Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
