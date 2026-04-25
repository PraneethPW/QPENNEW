const modelSelect = document.getElementById("modelSelect");
const languageDisplay = document.getElementById("languageDisplay");
const inputText = document.getElementById("inputText");
const predictButton = document.getElementById("predictButton");
const statusText = document.getElementById("statusText");
const tokenTableWrapper = document.getElementById("tokenTableWrapper");
const tokenTableBody = document.getElementById("tokenTableBody");
const resultEmpty = document.getElementById("resultEmpty");
const modelMeta = document.getElementById("modelMeta");
const datasetList = document.getElementById("datasetList");
const exampleList = document.getElementById("exampleList");

let modelCatalog = [];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function languageLabel(code) {
  return {
    en: "English",
    es: "Spanish",
    fr: "French",
    hi: "Hindi",
    nl: "Dutch",
    ru: "Russian",
    te: "Telugu",
    tr: "Turkish",
  }[code] || code;
}

function renderDatasets(datasets) {
  datasetList.innerHTML = "";
  datasets.forEach((code) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = languageLabel(code);
    datasetList.appendChild(pill);
  });
}

function renderModelMeta(model) {
  modelMeta.innerHTML = "";
  const items = [
    ["Model", model.name],
    ["Transformer", model.tfm_type],
    ["Source", languageLabel(model.src_lang)],
    ["Target", languageLabel(model.tgt_lang)],
    ["Experiment", model.exp_type],
    ["Checkpoint", model.checkpoint.split("\\").pop()],
  ];
  items.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    modelMeta.append(dt, dd);
  });
}

async function loadExamples(lang) {
  const data = await fetchJson(`/api/examples?lang=${encodeURIComponent(lang)}&split=test`);
  exampleList.innerHTML = "";
  data.examples.forEach((example) => {
    const button = document.createElement("button");
    button.className = "example-button";
    button.type = "button";
    button.textContent = example.text;
    button.addEventListener("click", () => {
      inputText.value = example.text;
    });
    exampleList.appendChild(button);
  });
  if (!data.examples.length) {
    exampleList.innerHTML = `<div class="muted-text">No sample examples found for this language.</div>`;
  }
}

function syncSelectedModel() {
  const selected = modelCatalog.find((model) => model.id === modelSelect.value);
  if (!selected) {
    return;
  }
  languageDisplay.value = languageLabel(selected.tgt_lang);
  renderModelMeta(selected);
  loadExamples(selected.tgt_lang).catch((error) => {
    exampleList.innerHTML = `<div class="muted-text">${error.message}</div>`;
  });
}

function renderPrediction(result) {
  tokenTableBody.innerHTML = "";
  result.tokens.forEach((token, index) => {
    const row = document.createElement("tr");
    const tokenCell = document.createElement("td");
    tokenCell.textContent = token;
    const tagCell = document.createElement("td");
    tagCell.textContent = result.tags[index] || "O";
    row.append(tokenCell, tagCell);
    tokenTableBody.appendChild(row);
  });
  resultEmpty.classList.add("hidden");
  tokenTableWrapper.classList.remove("hidden");
  renderModelMeta(result.model);
}

async function init() {
  statusText.textContent = "Loading available models...";
  const payload = await fetchJson("/api/models");
  modelCatalog = payload.models;
  renderDatasets(payload.datasets);

  modelSelect.innerHTML = "";
  modelCatalog.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = `${model.name} (${model.exp_type})`;
    modelSelect.appendChild(option);
  });

  if (!modelCatalog.length) {
    statusText.textContent = "No local checkpoints were found.";
    predictButton.disabled = true;
    return;
  }

  syncSelectedModel();
  statusText.textContent = "Ready.";
}

modelSelect.addEventListener("change", syncSelectedModel);

predictButton.addEventListener("click", async () => {
  try {
    statusText.textContent = "Running inference...";
    predictButton.disabled = true;
    const result = await fetchJson("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_id: modelSelect.value,
        text: inputText.value,
      }),
    });
    renderPrediction(result);
    statusText.textContent = "Inference complete.";
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    predictButton.disabled = false;
  }
});

init().catch((error) => {
  statusText.textContent = error.message;
});
