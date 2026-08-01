import './AuthBrand.css'

type AuthBrandProps = {
  title: string
  subtitle: string
}

const AuthBrand = ({ title, subtitle }: AuthBrandProps) => {
  return (
    <aside className="auth-brand" aria-label="VeriPanel">
      <div className="auth-brand-inner">
        <div className="auth-brand-logo-wrap">
          <img src="/logo.svg" alt="VeriPanel logo" className="auth-brand-logo-img" width={88} height={88} />
        </div>
        <p className="auth-brand-name">VeriPanel</p>
        <h2 className="auth-brand-title">{title}</h2>
        <p className="auth-brand-subtitle">{subtitle}</p>

        <ul className="auth-brand-features">
          <li>
            <span className="auth-brand-dot" />
            Anahtar tabanlı güvenli giriş
          </li>
          <li>
            <span className="auth-brand-dot" />
            SQL veritabanında şifreli saklama
          </li>
          <li>
            <span className="auth-brand-dot" />
            Şifre veya e-posta gerekmez
          </li>
        </ul>
      </div>
    </aside>
  )
}

export default AuthBrand
