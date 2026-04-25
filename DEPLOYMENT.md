# Deployment Guide

## 1. Push to GitHub

From the project root:

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN
git init -b main
git add .
git commit -m "Prepare QPEN for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Deploy backend to Railway

Railway can deploy the repo root directly.

Files already prepared:

- `requirements.txt`
- `Procfile`
- `runtime.txt`

Railway start command:

```bash
python app_server.py --host 0.0.0.0 --port $PORT
```

After deploy, Railway will give you a public backend URL like:

```text
https://your-qpen-backend.up.railway.app
```

## 3. Point frontend to Railway backend

Edit:

`frontend-react/config.js`

Change:

```js
window.QPEN_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8001"
};
```

to:

```js
window.QPEN_CONFIG = {
  API_BASE_URL: "https://your-qpen-backend.up.railway.app"
};
```

Then commit and push again.

## 4. Deploy frontend to Vercel

Because `frontend-react` is a static frontend, you can deploy that folder only.

Recommended:

1. Create a separate GitHub repo for just `frontend-react`, or
2. Import the main repo and set the Vercel root directory to `frontend-react`

For Vercel:

- Framework preset: `Other`
- Root directory: `frontend-react`

Since this frontend is static, Vercel can serve it directly.

## 5. Local run

Backend:

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN
C:\Users\prane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe .\app_server.py --port 8001
```

Frontend:

```powershell
cd C:\Users\prane\Documents\Codex\2026-04-24\build-and-execute-the-code-from\QPEN\frontend-react
python -m http.server 5173
```
