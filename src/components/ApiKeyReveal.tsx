import { useState } from 'react'
import './ApiKeyReveal.css'

type ApiKeyRevealProps = {
  apiKey: string
  onContinue: () => void
}

const ApiKeyReveal = ({ apiKey, onContinue }: ApiKeyRevealProps) => {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="api-key-reveal" role="dialog" aria-labelledby="api-key-title">
      <div className="api-key-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4Z" stroke="currentColor" strokeWidth="1.75" />
          <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 id="api-key-title">API anahtarınız hazır</h2>
      <p className="api-key-warning">
        Bu anahtar <strong>yalnızca bir kez</strong> gösterilir. Güvenli şekilde saklanır —
        kaybederseniz yeni hesap oluşturmanız gerekir.
      </p>

      <div className="api-key-box">
        <code>{apiKey}</code>
        <button type="button" className="api-key-copy" onClick={handleCopy}>
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>

      <ul className="api-key-tips">
        <li>Şifre yöneticisine veya güvenli not uygulamasına kaydedin</li>
        <li>Kimseyle paylaşmayın</li>
        <li>Giriş yapmak için bu anahtarı kullanın</li>
      </ul>

      <button type="button" className="btn auth-submit" onClick={onContinue}>
        Anahtarı kaydettim, panele git
      </button>
    </div>
  )
}

export default ApiKeyReveal
