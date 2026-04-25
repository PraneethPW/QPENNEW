import { Link } from "react-router-dom";

const languages = ["English", "Spanish", "French", "Dutch", "Russian", "Turkish", "Hindi", "Telugu"];

export default function LandingPage() {
  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">Q</span>
          <span>QPEN Studio</span>
        </Link>
        <nav className="topnav">
          <a href="#platform">Platform</a>
          <a href="#languages">Languages</a>
          <Link className="button button-primary" to="/app">
            Open Workspace
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Quantum-powered multilingual ABSA</p>
            <h1>Professional BIOES tagging with a dedicated React workspace.</h1>
            <p className="hero-text">
              QPEN Studio now separates the product surface from the inference service, pairing a React frontend with a
              Python backend for a cleaner, more scalable workflow.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/app">
                Launch App
              </Link>
              <a className="button button-secondary" href="#platform">
                View Capabilities
              </a>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <strong>React Frontend</strong>
                <span>Separate UI server with product-style pages</span>
              </div>
              <div className="stat-card">
                <strong>Python API</strong>
                <span>Checkpoint-backed multilingual inference</span>
              </div>
              <div className="stat-card">
                <strong>BIOES Output</strong>
                <span>Consistent token-level tagging results</span>
              </div>
            </div>
          </div>

          <div className="preview-card">
            <div className="panel-top">
              <span>Workspace Preview</span>
              <span className="pill success">Live Architecture</span>
            </div>
            <div className="panel-stack">
              <div className="stack-card stack-card-frontend">
                <span>Frontend</span>
                <strong>React + Vite</strong>
                <p>Landing page, model workspace, example loading, prediction rendering.</p>
              </div>
              <div className="stack-arrow">↓</div>
              <div className="stack-card stack-card-backend">
                <span>Backend</span>
                <strong>Python API</strong>
                <p>`/api/models`, `/api/examples`, `/api/predict` with multilingual checkpoint inference.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="platform">
          <div className="section-head">
            <p className="eyebrow">Platform</p>
            <h2>Built for research demos that still feel production-minded.</h2>
          </div>
          <div className="card-grid">
            <article className="info-card">
              <h3>Separate concerns</h3>
              <p>The frontend runs independently on its own dev server while the backend stays focused on inference.</p>
            </article>
            <article className="info-card">
              <h3>Checkpoint-aware workspace</h3>
              <p>The UI reflects locally available models and dataset languages instead of hard-coded marketing placeholders.</p>
            </article>
            <article className="info-card">
              <h3>Token-level clarity</h3>
              <p>Predictions are rendered as BIOES tags so reviews can be inspected in a structured, comparable way.</p>
            </article>
          </div>
        </section>

        <section className="section" id="languages">
          <div className="section-head">
            <p className="eyebrow">Languages</p>
            <h2>Original multilingual setup extended with Hindi and Telugu.</h2>
          </div>
          <div className="language-cloud">
            {languages.map((language) => (
              <span key={language} className="language-pill">
                {language}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
