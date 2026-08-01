import './AuthBrand.css'

type AuthBrandProps = {
  title: string
  subtitle: string
}

const AuthBrand = ({ title, subtitle }: AuthBrandProps) => {
  return (
    <aside className="auth-brand" aria-label="VeriPanel">
      <div className="auth-brand-inner">
        <p className="auth-brand-name">VeriPanel</p>
        <h2 className="auth-brand-title">{title}</h2>
        <p className="auth-brand-subtitle">{subtitle}</p>

        <ul className="auth-brand-features">
          <li>Anahtar tabanlı güvenli giriş</li>
          <li>SQL veritabanında şifreli saklama</li>
          <li>Şifre veya e-posta gerekmez</li>
        </ul>
      </div>
    </aside>
  )
}

export default AuthBrand
