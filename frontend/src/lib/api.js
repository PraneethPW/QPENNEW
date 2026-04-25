const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function readJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function fetchModels() {
  return readJson("/api/models");
}

export function fetchExamples(lang, split = "test") {
  return readJson(`/api/examples?lang=${encodeURIComponent(lang)}&split=${encodeURIComponent(split)}`);
}

export function predict(modelId, text) {
  return readJson("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model_id: modelId,
      text
    })
  });
}
