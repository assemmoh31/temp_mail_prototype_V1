# Temp Mail Prototype

This workspace contains a minimal temp mail backend (Express + SQLite) and a Vite + React frontend.

Quick start (PowerShell):

1. Backend

```powershell
cd backend
npm install
npm run start
```

2. Frontend (separate terminal)

```powershell
cd frontend
npm install
npm run dev
```

Backend listens on `http://localhost:3001`.
Vite dev server runs on `http://localhost:5173` by default.

You can POST test messages to `POST http://localhost:3001/api/receive`.
