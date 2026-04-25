# QPEN React Frontend

This is a separate React frontend served independently from the Python backend.

## Run frontend

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN\frontend-react
python -m http.server 5173
```

Open:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/app.html`

## Run backend

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN
C:\Users\prane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe .\app_server.py --port 8001
```
