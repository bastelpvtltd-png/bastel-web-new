# 🌐 Bastel Pvt Ltd — Full Stack Website

> Your Global Trade Catalyst — Freight · Customs · Logistics · Trade

---

## 📁 Project Structure

```
bastel_full/
├── frontend/
│   ├── index.html                  ← Home page
│   ├── assets/
│   │   ├── bastel.png
│   │   ├── video1.mp4
│   │   ├── video2.mp4
│   │   └── video3.mp4
│   ├── css/
│   │   ├── shared.css              ← Nav, footer, buttons, forms (all pages)
│   │   ├── index.css               ← Home page styles
│   │   ├── services.css
│   │   ├── freight-process.css
│   │   ├── register.css
│   │   └── upcoming.css
│   ├── js/
│   │   ├── shared.js               ← Cursor, nav, cookie, chatbot, logger
│   │   ├── contact.js              ← EmailJS contact form
│   │   ├── register.js             ← Registration → API
│   │   └── upcoming.js             ← Countdown + notify → API
│   └── pages/
│       ├── services.html
│       ├── freight-process.html
│       ├── register.html
│       └── upcoming.html
├── backend/
│   ├── server.js                   ← Express app entry point
│   ├── package.json
│   ├── .env.example                ← Copy to .env and fill in
│   ├── config/
│   │   └── supabase.js
│   ├── middleware/
│   │   └── logger.js
│   └── routes/
│       ├── register.js             ← POST/GET /api/register
│       ├── notify.js               ← POST/GET /api/notify
│       └── contact.js              ← POST/GET /api/contact
├── scripts/
│   └── supabase_schema.sql         ← Run this in Supabase SQL Editor
├── render.yaml                     ← Render.com deploy config
├── .gitignore
└── README.md
```

---

## 🚀 Local Setup (Step by Step)

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste the contents of `scripts/supabase_schema.sql` → **Run**
3. Go to **Settings → API** → copy:
   - `Project URL` → this is your `https://egdaphsflipplvphbhdo.supabase.co`
   - `service_role` key → this is your `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGFwaHNmbGlwcGx2cGhiaGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkzMjc4MSwiZXhwIjoyMDkzNTA4NzgxfQ.47Y2yj6fAlOu6uN57yFoy6nHuHxQJNUJynj6gnboZJ4`

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and fill in your SUPABASE_URL and SUPABASE_SERVICE_KEY
npm install
npm run dev        # starts on http://localhost:3000
```

Test backend is running:
```bash
curl http://localhost:3000/health
# → {"status":"ok","ts":"..."}
```

### 3. Frontend Setup

Open `frontend/index.html` in a browser — or use Live Server (VS Code extension).

> ⚠️ **Important:** Frontend JS uses `BASTEL_CONFIG.API_BASE` which auto-detects:
> - `localhost` → `http://localhost:3000/api`
> - Production → `/api` (served from same Render domain)

No build step needed. Pure HTML/CSS/JS.

---

## ☁️ Deploy to Render (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — Bastel full stack"
git remote add origin https://github.com/YOUR_USERNAME/bastel.git
git push -u origin main
```

### Step 2 — Deploy on Render
1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` automatically → creates 2 services:
   - `bastel-backend` (Node.js API)
   - `bastel-frontend` (Static site)

### Step 3 — Set Environment Variables
In Render Dashboard → `bastel-backend` service → **Environment**:
```
SUPABASE_URL         = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = your-service-role-key
ALLOWED_ORIGINS      = https://bastel-frontend.onrender.com
NODE_ENV             = production
```

### Step 4 — Update Frontend API URL
In `frontend/js/shared.js`, find `BASTEL_CONFIG` and update:
```js
ALLOWED_ORIGINS: 'https://bastel-backend.onrender.com'
```
The frontend auto-sends API calls to `/api` in production (served by Render).

---

## 🗄️ Supabase Tables

| Table | Purpose |
|-------|---------|
| `registrations` | Exporter / Importer registrations |
| `notify_list` | "Notify me at launch" signups |
| `contact_messages` | Contact form submissions |

View data: Supabase Dashboard → **Table Editor**

---

## 📄 Pages

| Page | URL |
|------|-----|
| Home | `/index.html` |
| Services | `/pages/services.html` |
| Freight Process | `/pages/freight-process.html` |
| Register | `/pages/register.html` |
| Trade Direct (Upcoming) | `/pages/upcoming.html` |

---

## 🔑 Features

- ✅ Multi-page HTML structure with shared nav/footer
- ✅ Exporter & Importer registration → Supabase DB
- ✅ Freight process with all sub-steps (container removal, vessel transfer etc.)
- ✅ Upcoming "Trade Direct" page with countdown timer
- ✅ Notify-me list for launch
- ✅ Cookie consent with localStorage
- ✅ Client-side logger (BLog) — persists to localStorage
- ✅ EmailJS contact form (no server needed for email)
- ✅ Custom animated cursor, smooth nav, scroll reveal
- ✅ Rate limiting, CORS, Helmet security headers
- ✅ Render.com deploy-ready

---

## 📧 EmailJS Notes

The contact form uses EmailJS (already configured in your original site).
Keys are in `frontend/index.html` — no changes needed unless you regenerate them.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5 · CSS3 · Vanilla JS |
| Backend | Node.js · Express.js |
| Database | Supabase (PostgreSQL) |
| Email | EmailJS |
| Deploy | Render.com |
| Fonts | Google Fonts (Bebas Neue, Cormorant, DM Sans) |
"# bastel-web-new" 
