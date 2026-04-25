const { useEffect, useMemo, useState } = React;

const API_BASE_URL =
  (window.QPEN_CONFIG && window.QPEN_CONFIG.API_BASE_URL) || "http://127.0.0.1:8001";

const languageLabels = {
  en: "English",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  nl: "Dutch",
  ru: "Russian",
  te: "Telugu",
  tr: "Turkish",
};

function languageLabel(code) {
  return languageLabels[code] || code;
}

async function readJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function LandingPage() {
  const languages = ["English", "Spanish", "French", "Dutch", "Russian", "Turkish", "Hindi", "Telugu"];

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a href="./index.html" className="brand">
          <span className="brand-mark">Q</span>
          <span>QPEN Studio</span>
        </a>
        <nav className="topnav">
          <a href="#platform">Platform</a>
          <a href="#languages">Languages</a>
          <a className="button button-primary" href="./app.html">Open Workspace</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Separate React frontend</p>
            <h1>Professional pages for multilingual BIOES inference.</h1>
            <p className="hero-text">
              This frontend runs independently from the Python backend and gives the QPEN workflow a cleaner product
              experience with a dedicated landing page and a separate analysis workspace.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="./app.html">Launch App</a>
              <a className="button button-secondary" href="#platform">View Platform</a>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <strong>React UI</strong>
                <span>Standalone frontend server</span>
              </div>
              <div className="stat-card">
                <strong>Python API</strong>
                <span>Backend-only inference process</span>
              </div>
              <div className="stat-card">
                <strong>BIOES Output</strong>
                <span>Structured multilingual tag rendering</span>
              </div>
            </div>
          </div>

          <div className="preview-card">
            <div className="panel-top">
              <span>System Layout</span>
              <span className="pill success">Connected</span>
            </div>
            <div className="panel-stack">
              <div className="stack-card">
                <span>Frontend</span>
                <strong>React pages</strong>
                <p>Landing page and workspace page served separately from the backend process.</p>
              </div>
              <div className="stack-arrow">↓</div>
              <div className="stack-card">
                <span>Backend</span>
                <strong>QPEN inference API</strong>
                <p>Model listing, example loading, and BIOES prediction routes exposed over HTTP.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="platform">
          <div className="section-head">
            <p className="eyebrow">Platform</p>
            <h2>Designed to look like a product, not just a research demo.</h2>
          </div>
          <div className="card-grid">
            <article className="info-card">
              <h3>Intentional landing page</h3>
              <p>The first page frames the platform, the model stack, and the multilingual ABSA use case professionally.</p>
            </article>
            <article className="info-card">
              <h3>Dedicated main app</h3>
              <p>The workspace is focused on inference, examples, checkpoints, and BIOES-tagged outputs.</p>
            </article>
            <article className="info-card">
              <h3>Backend integration</h3>
              <p>The React frontend talks directly to the Python API so the UI and inference flow stay cleanly separated.</p>
            </article>
          </div>
        </section>

        <section className="section" id="languages">
          <div className="section-head">
            <p className="eyebrow">Languages</p>
            <h2>Multilingual coverage with Hindi and Telugu included.</h2>
          </div>
          <div className="language-cloud">
            {languages.map((language) => (
              <span key={language} className="language-pill">{language}</span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function WorkspacePage() {
  const [catalog, setCatalog] = useState({ datasets: [], models: [] });
  const [selectedModelId, setSelectedModelId] = useState("");
  const [examples, setExamples] = useState([]);
  const [text, setText] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [status, setStatus] = useState("Loading models...");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const payload = await readJson("/api/models");
        setCatalog(payload);
        if (payload.models.length) {
          setSelectedModelId(payload.models[0].id);
          setStatus("Ready.");
        } else {
          setStatus("No local checkpoints found.");
        }
      } catch (error) {
        setStatus(error.message);
      }
    }
    loadCatalog();
  }, []);

  const selectedModel = useMemo(
    () => catalog.models.find((model) => model.id === selectedModelId) || null,
    [catalog.models, selectedModelId]
  );

  useEffect(() => {
    async function loadExamples() {
      if (!selectedModel) {
        setExamples([]);
        return;
      }
      try {
        const payload = await readJson(`/api/examples?lang=${encodeURIComponent(selectedModel.tgt_lang)}&split=test`);
        setExamples(payload.examples);
      } catch (error) {
        setExamples([]);
        setStatus(error.message);
      }
    }
    loadExamples();
  }, [selectedModel]);

  async function handlePredict() {
    if (!selectedModelId) {
      setStatus("Select a model first.");
      return;
    }
    if (!text.trim()) {
      setStatus("Enter a sentence to analyze.");
      return;
    }
    setIsRunning(true);
    setStatus("Running inference...");
    try {
      const payload = await readJson("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: selectedModelId, text }),
      });
      setPrediction(payload);
      setStatus("Inference complete.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <a href="./index.html" className="brand sidebar-brand">
          <span className="brand-mark">Q</span>
          <span>QPEN Studio</span>
        </a>

        <section className="sidebar-card">
          <p className="sidebar-title">Backend API</p>
          <div className="connection-box">
            <strong>{API_BASE_URL}</strong>
            <span>Separate Python service</span>
          </div>
        </section>

        <section className="sidebar-card">
          <p className="sidebar-title">Detected datasets</p>
          <div className="pill-wrap">
            {catalog.datasets.map((code) => (
              <span key={code} className="language-pill">{languageLabel(code)}</span>
            ))}
          </div>
        </section>

        <section className="sidebar-card">
          <p className="sidebar-title">Sample examples</p>
          <div className="sample-list">
            {examples.length ? (
              examples.map((example) => (
                <button key={example.text} className="sample-card" onClick={() => setText(example.text)} type="button">
                  {example.text}
                </button>
              ))
            ) : (
              <p className="muted-copy">No sample examples available yet.</p>
            )}
          </div>
        </section>
      </aside>

      <main className="workspace-main">
        <section className="workspace-hero">
          <div>
            <p className="eyebrow">Main workspace</p>
            <h1>React frontend connected to the QPEN backend.</h1>
            <p className="hero-text">
              Run multilingual checkpoint inference and inspect token-level BIOES output from a dedicated frontend.
            </p>
          </div>
          <span className="pill success">{status}</span>
        </section>

        <section className="composer-card">
          <div className="form-row">
            <label className="field">
              <span>Model checkpoint</span>
              <select value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)}>
                {catalog.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.exp_type})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Target language</span>
              <input readOnly value={selectedModel ? languageLabel(selectedModel.tgt_lang) : ""} />
            </label>
          </div>

          <label className="field">
            <span>Review text</span>
            <textarea
              rows="6"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Enter a review sentence to generate BIOES tags..."
            />
          </label>

          <div className="action-bar">
            <button className="button button-primary" onClick={handlePredict} disabled={isRunning} type="button">
              {isRunning ? "Running..." : "Run Inference"}
            </button>
            <span className="muted-copy">Frontend and backend run as separate processes.</span>
          </div>
        </section>

        <section className="results-grid">
          <article className="results-card">
            <div className="panel-top">
              <span>Token-level BIOES output</span>
              <span className="pill subtle">Prediction</span>
            </div>
            {prediction ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Predicted tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.tokens.map((token, index) => (
                      <tr key={`${token}-${index}`}>
                        <td>{token}</td>
                        <td>{prediction.tags[index] || "O"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel">Run inference to populate token-level BIOES predictions.</div>
            )}
          </article>

          <article className="results-card">
            <div className="panel-top">
              <span>Runtime metadata</span>
              <span className="pill subtle">Model</span>
            </div>
            {selectedModel ? (
              <dl className="meta-grid">
                <dt>Transformer</dt>
                <dd>{selectedModel.tfm_type}</dd>
                <dt>Source language</dt>
                <dd>{languageLabel(selectedModel.src_lang)}</dd>
                <dt>Target language</dt>
                <dd>{languageLabel(selectedModel.tgt_lang)}</dd>
                <dt>Experiment</dt>
                <dd>{selectedModel.exp_type}</dd>
                <dt>Checkpoint</dt>
                <dd>{selectedModel.checkpoint}</dd>
              </dl>
            ) : (
              <div className="empty-panel">No model selected.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

function App() {
  const root = document.getElementById("root");
  const page = root.dataset.page;
  return page === "workspace" ? <WorkspacePage /> : <LandingPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
