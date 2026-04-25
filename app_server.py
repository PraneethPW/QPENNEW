import json
import os
import re
import sys
import argparse
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


PROJECT_ROOT = Path(__file__).resolve().parent
MANUAL_PACKAGES = PROJECT_ROOT / ".packages-manual"
if MANUAL_PACKAGES.exists():
    sys.path.insert(0, str(MANUAL_PACKAGES))

import torch
from transformers import BertConfig, BertTokenizerFast, XLMRobertaConfig, XLMRobertaTokenizerFast

from data_utils import detect_available_languages, get_tag_vocab
from model import BertQPENTagger, XLMRQPENTagger
from seq_utils import convert_tags_to_bioes


MODEL_CLASSES = {
    "bert": (BertConfig, BertQPENTagger, BertTokenizerFast),
    "mbert": (BertConfig, BertQPENTagger, BertTokenizerFast),
    "xlmr": (XLMRobertaConfig, XLMRQPENTagger, XLMRobertaTokenizerFast),
}

LANGUAGE_LABELS = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "hi": "Hindi",
    "nl": "Dutch",
    "ru": "Russian",
    "te": "Telugu",
    "tr": "Turkish",
}


class QPENPredictor:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.outputs_dir = root_dir / "outputs"
        self.device = torch.device("cpu")
        self._cache = {}
        self._lock = threading.Lock()

    def list_datasets(self):
        return detect_available_languages(str(self.root_dir / "data"))

    def list_models(self):
        if not self.outputs_dir.exists():
            return []
        models = []
        for output_dir in sorted(self.outputs_dir.iterdir()):
            if not output_dir.is_dir():
                continue
            match = re.match(r"(?P<tfm>[^-]+)-(?P<src>[^-]+)-(?P<tgt>[^-]+)-(?P<exp>.+)", output_dir.name)
            if not match:
                continue
            checkpoints = sorted(
                [p for p in output_dir.iterdir() if p.is_dir() and p.name.startswith("checkpoint-")],
                key=lambda p: int(p.name.split("-")[-1]),
            )
            if not checkpoints:
                continue
            latest = checkpoints[-1]
            tgt_lang = match.group("tgt")
            models.append(
                {
                    "id": output_dir.name,
                    "name": f"{match.group('tfm').upper()} {LANGUAGE_LABELS.get(tgt_lang, tgt_lang)}",
                    "tfm_type": match.group("tfm"),
                    "src_lang": match.group("src"),
                    "tgt_lang": tgt_lang,
                    "exp_type": match.group("exp"),
                    "checkpoint": str(latest),
                    "available_prediction_file": str(output_dir / f"{match.group('src')}-{tgt_lang}-preds-1.bioes.txt"),
                }
            )
        return models

    def get_examples(self, lang: str, split: str = "test", limit: int = 3):
        file_path = self.root_dir / "data" / "rest" / f"gold-{lang}-{split}.txt"
        if not file_path.exists():
            return []
        examples = []
        words, labels = [], []
        with file_path.open("r", encoding="utf-8") as fp:
            for raw_line in fp:
                line = raw_line.strip()
                if not line:
                    if words:
                        examples.append({"text": " ".join(words), "tokens": words[:], "labels": labels[:]})
                    words, labels = [], []
                    if len(examples) >= limit:
                        break
                    continue
                token, label, _ = raw_line.rstrip("\n").split("\t")
                words.append(token)
                labels.append(label)
        return examples

    def _load_model(self, model_id: str):
        if model_id in self._cache:
            return self._cache[model_id]
        models = {model["id"]: model for model in self.list_models()}
        if model_id not in models:
            raise ValueError(f"Unknown model '{model_id}'")
        model_info = models[model_id]
        checkpoint = Path(model_info["checkpoint"])
        config_class, model_class, tokenizer_class = MODEL_CLASSES[model_info["tfm_type"]]
        tag_list, tag2idx, idx2tag = get_tag_vocab("absa", "BIOES", "")
        config = config_class.from_pretrained(
            str(checkpoint),
            num_labels=len(tag_list),
            id2label=idx2tag,
            label2id=tag2idx,
        )
        tokenizer = tokenizer_class.from_pretrained(str(checkpoint))
        model = model_class.from_pretrained(str(checkpoint), config=config)
        model.to(self.device)
        model.eval()
        loaded = {
            "info": model_info,
            "tokenizer": tokenizer,
            "model": model,
            "idx2tag": idx2tag,
        }
        self._cache[model_id] = loaded
        return loaded

    def predict(self, model_id: str, text: str):
        text = text.strip()
        if not text:
            raise ValueError("Text is required")
        with self._lock:
            loaded = self._load_model(model_id)
            tokenizer = loaded["tokenizer"]
            model = loaded["model"]
            idx2tag = loaded["idx2tag"]

            words = text.split()
            encoded = tokenizer(
                [words],
                is_split_into_words=True,
                return_offsets_mapping=True,
                truncation=True,
                padding="max_length",
                max_length=200,
                return_tensors="pt",
            )
            offset_mapping = encoded.pop("offset_mapping")[0].tolist()
            inputs = {key: value.to(self.device) for key, value in encoded.items()}
            if "token_type_ids" not in inputs:
                inputs["token_type_ids"] = None

            with torch.no_grad():
                logits = model(**inputs)[0]
            pred_ids = torch.argmax(logits, dim=-1)[0].cpu().tolist()

            kept_tags = []
            for pred_id, (start, end) in zip(pred_ids, offset_mapping):
                if start == 0 and end != 0:
                    kept_tags.append(idx2tag[pred_id])
            kept_tags = kept_tags[: len(words)]
            kept_tags = convert_tags_to_bioes(kept_tags, task="absa", tagging_schema="BIOES")

        return {
            "model": loaded["info"],
            "text": text,
            "tokens": words,
            "tags": kept_tags,
        }


PREDICTOR = QPENPredictor(PROJECT_ROOT)


def add_cors_headers(handler: BaseHTTPRequestHandler):
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


def json_response(handler: BaseHTTPRequestHandler, payload, status=HTTPStatus.OK):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    add_cors_headers(handler)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def file_response(handler: BaseHTTPRequestHandler, file_path: Path, content_type: str):
    data = file_path.read_bytes()
    handler.send_response(HTTPStatus.OK)
    add_cors_headers(handler)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class QPENRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        add_cors_headers(self)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/":
            return file_response(self, PROJECT_ROOT / "web" / "landing.html", "text/html; charset=utf-8")
        if path == "/app":
            return file_response(self, PROJECT_ROOT / "web" / "app.html", "text/html; charset=utf-8")
        if path.startswith("/static/"):
            static_path = (PROJECT_ROOT / "web" / path.lstrip("/")).resolve()
            web_root = (PROJECT_ROOT / "web").resolve()
            if web_root not in static_path.parents:
                return self.send_error(HTTPStatus.FORBIDDEN)
            if not static_path.exists():
                return self.send_error(HTTPStatus.NOT_FOUND)
            content_type = "text/plain; charset=utf-8"
            if static_path.suffix == ".css":
                content_type = "text/css; charset=utf-8"
            elif static_path.suffix == ".js":
                content_type = "application/javascript; charset=utf-8"
            elif static_path.suffix == ".svg":
                content_type = "image/svg+xml"
            return file_response(self, static_path, content_type)

        if path == "/api/health":
            return json_response(self, {"status": "ok"})
        if path == "/api/models":
            payload = {
                "datasets": PREDICTOR.list_datasets(),
                "models": PREDICTOR.list_models(),
            }
            return json_response(self, payload)
        if path == "/api/examples":
            query = parse_qs(parsed.query)
            lang = query.get("lang", ["hi"])[0]
            split = query.get("split", ["test"])[0]
            return json_response(self, {"examples": PREDICTOR.get_examples(lang, split)})

        return self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/predict":
            return self.send_error(HTTPStatus.NOT_FOUND)
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body.decode("utf-8"))
            prediction = PREDICTOR.predict(payload.get("model_id", ""), payload.get("text", ""))
            return json_response(self, prediction)
        except ValueError as exc:
            return json_response(self, {"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            return json_response(self, {"error": f"Prediction failed: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def log_message(self, fmt, *args):
        return


def run_server(host="127.0.0.1", port=8001):
    server = ThreadingHTTPServer((host, port), QPENRequestHandler)
    print(f"QPEN web app running at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    cli_args = parser.parse_args()
    run_server(host=cli_args.host, port=cli_args.port)
