import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-gradient"></div>
      <div className="container">
        <nav className="navbar">
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="https://docs.breachbase.xyz" target="_blank" rel="noopener noreferrer">Documentation</a>
          </div>
          <button className="btn-nav">Get Access</button>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Professional OSINT Intelligence
          </div>
          
          <h1 className="hero-title">
            Breach Data Intelligence<br />
            <span className="gradient-text">Built for Professionals</span>
          </h1>
          
          <p className="hero-description">
            Access 700 billion breach records through our lightning-fast API. 
            Real-time intelligence, verified sources, and enterprise infrastructure 
            for just €5 per month.
          </p>

          <div className="hero-cta">
            <button className="btn-large btn-primary">
              Start Building
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-large btn-secondary">
              View Documentation
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">700B+</div>
              <div className="stat-label">Records Indexed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">API Uptime</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">&lt;50ms</div>
              <div className="stat-label">Avg Response</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="code-window">
            <div className="code-header">
              <div className="code-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="code-title">api_request.ts</span>
            </div>
            <div className="code-content">
              <pre><code><span className="code-comment">// Query breach data instantly</span>
<span className="code-keyword">const</span> <span className="code-variable">response</span> = <span className="code-keyword">await</span> <span className="code-function">fetch</span>(<span className="code-string">'https://api.breachbase.xyz/v1/search'</span>, {'{'}
  <span className="code-property">method</span>: <span className="code-string">'POST'</span>,
  <span className="code-property">headers</span>: {'{'} 
    <span className="code-string">'Authorization'</span>: <span className="code-string">'Bearer YOUR_API_KEY'</span>
  {'}'},
  <span className="code-property">body</span>: <span className="code-function">JSON.stringify</span>({'{'} 
    <span className="code-property">email</span>: <span className="code-string">'user@example.com'</span> 
  {'}'})
{'}'});

<span className="code-keyword">const</span> <span className="code-variable">data</span> = <span className="code-keyword">await</span> response.<span className="code-function">json</span>();
<span className="code-comment">// Get instant breach intelligence</span></code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
