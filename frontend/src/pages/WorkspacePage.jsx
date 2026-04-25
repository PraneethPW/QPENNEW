import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchExamples, fetchModels, getApiBaseUrl, predict } from "../lib/api.js";

const languageLabels = {
  en: "English",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  nl: "Dutch",
  ru: "Russian",
  te: "Telugu",
  tr: "Turkish"
};

function languageLabel(code) {
  return languageLabels[code] || code;
}

export default function WorkspacePage() {
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
        const payload = await fetchModels();
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

  const selectedModel = catalog.models.find((model) => model.id === selectedModelId) || null;

  useEffect(() => {
    async function loadExamples() {
      if (!selectedModel) {
        setExamples([]);
        return;
      }
      try {
        const payload = await fetchExamples(selectedModel.tgt_lang, "test");
        setExamples(payload.examples);
      } catch (error) {
        setExamples([]);
        setStatus(error.message);
      }
    }
    loadExamples();
  }, [selectedModelId]);

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
      const payload = await predict(selectedModelId, text);
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
        <Link to="/" className="brand sidebar-brand">
          <span className="brand-mark">Q</span>
          <span>QPEN Studio</span>
        </Link>

        <section className="sidebar-card">
          <p className="sidebar-title">Backend API</p>
          <div className="connection-box">
            <strong>{getApiBaseUrl()}</strong>
            <span>Python inference service</span>
          </div>
        </section>

        <section className="sidebar-card">
          <p className="sidebar-title">Detected datasets</p>
          <div className="pill-wrap">
            {catalog.datasets.map((code) => (
              <span key={code} className="language-pill">
                {languageLabel(code)}
              </span>
            ))}
          </div>
        </section>

        <section className="sidebar-card">
          <p className="sidebar-title">Sample test examples</p>
          <div className="sample-list">
            {examples.length ? (
              examples.map((example) => (
                <button key={example.text} className="sample-card" onClick={() => setText(example.text)} type="button">
                  {example.text}
                </button>
              ))
            ) : (
              <p className="muted-copy">No examples available for the selected language yet.</p>
            )}
          </div>
        </section>
      </aside>

      <main className="workspace-main">
        <section className="workspace-hero">
          <div>
            <p className="eyebrow">Main workspace</p>
            <h1>Separate React frontend, connected Python backend.</h1>
            <p className="hero-text">
              Choose a locally available checkpoint, test multilingual text, and inspect token-level BIOES predictions.
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
              placeholder="Enter a sentence like: डेज़र्ट ताज़ा था ."
            />
          </label>

          <div className="action-bar">
            <button className="button button-primary" onClick={handlePredict} disabled={isRunning} type="button">
              {isRunning ? "Running..." : "Run Inference"}
            </button>
            <span className="muted-copy">Frontend on 5173, backend on 8000.</span>
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
