# QPEN Frontend

## Run in development

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN\frontend
npm install
npm run dev
```

The React app runs on `http://127.0.0.1:5173`.

## Backend

Run the Python backend separately from the QPEN root:

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN
C:\Users\prane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe .\app_server.py
```

The frontend talks to the backend using `VITE_API_BASE_URL`, which defaults to `http://127.0.0.1:8000`.
