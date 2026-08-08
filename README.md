<div align="center">
  <img src="./blinkpaste_banner.png" alt="BlinkPaste Logo" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  # BlinkPaste ⚡
  
  **Blink. Paste. Gone.**
  
  *A zero-knowledge, end-to-end encrypted workspace for real-time clipboard sync, ephemeral messaging, file sharing, and self-destructing secrets — across any device. No account required.*

  [![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://blinkpaste.vercel.app)
  [![Database: Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
  [![React](https://img.shields.io/badge/Frontend-React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Vite](https://img.shields.io/badge/Bundler-Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
  [![Encryption](https://img.shields.io/badge/Encryption-AES--GCM--256-E8FF47?style=for-the-badge&logo=letsencrypt&logoColor=black)](#)
</div>

---

## What is BlinkPaste?

BlinkPaste v2.0 is a complete, production-grade ephemeral collaboration workspace. Create a session with a passcode, share the session ID, and instantly sync clipboard items, chat messages, files, and encrypted secrets between any number of devices — all client-side encrypted with AES-GCM-256. Everything self-destructs when the session expires.

> No accounts. No persistence. No traces.

---

## ✨ What's New in v2.0

| | v1.0 | v2.0 |
|---|---|---|
| Clipboard Sync | ✅ | ✅ |
| Real-time Messages | ✅ | ✅ |
| End-to-End Encryption | ❌ | ✅ AES-GCM-256 + PBKDF2 |
| File Sharing | ❌ | ✅ Supabase Storage |
| Self-Destructing Secrets | ❌ | ✅ 1-view / timer / max-views |
| Host Controls | ❌ | ✅ Lock, kick, transfer host |
| QR Code Join | ❌ | ✅ |
| Security Event Log | ❌ | ✅ |
| Session Device Registry | ❌ | ✅ |
| Workspace UI | Basic | Full sidebar workspace |

---

## ✨ Features

* **🔐 End-to-End Encryption** — All content is encrypted client-side using AES-GCM (256-bit). Keys are derived via PBKDF2 (100,000 iterations) from your session passcode. The server only ever stores ciphertext — plaintext never leaves your browser.
* **⚡ Instant Sync** — Under 100ms latency powered by Supabase Realtime Postgres Changes over WebSockets.
* **🕒 Ephemeral by Design** — Sessions expire in 60 minutes. PostgreSQL cascade deletes purge all data automatically. No recovery, no traces.
* **📋 Clipboard Sync** — Paste once, receive everywhere. Works across HTTP and HTTPS contexts.
* **💬 Real-Time Messages** — Chat with burn modes: self-destruct after 1 view, a timer, or a max view count.
* **📁 File Sharing** — Upload and share files via Supabase Storage. Files are scoped to the session.
* **🔑 Secrets Vault** — Store API keys, passwords, and tokens. Each secret self-destructs based on your chosen burn policy.
* **👑 Host Controls** — Lock/unlock sessions, kick participants, transfer host privileges, or destroy the session instantly.
* **📱 QR Code Join** — Share the session via QR code for instant mobile join.
* **🛡️ Security Log** — Full audit trail of joins, kicks, host transfers, and security events.
* **💫 Sleek UI/UX** — Premium dark mode workspace with glassmorphism, ambient glows, Plus Jakarta Sans typography, and fluid micro-animations.

---

## 🏗️ Architecture

```text
Browser (React + Vite)
  └─ Web Crypto API (AES-GCM-256 + PBKDF2)   ← All encryption happens here
       └─ Supabase JS v2
            ├─ sessions_v2         ← Session metadata, host_device_id, is_locked
            ├─ devices             ← Connected devices with role and is_blocked
            ├─ clipboard_items     ← Encrypted clipboard entries
            ├─ messages_v2         ← Encrypted messages with burn_type
            ├─ secrets             ← Encrypted secrets with max_views / expires_at
            ├─ files               ← File metadata (storage path, mime, size)
            └─ security_events     ← Audit log per session
            
Supabase Realtime Channels
  └─ session:{sessionId}
       ├─ postgres_changes (INSERT/UPDATE/DELETE on all tables)
       ├─ Device kick detection via is_blocked UPDATE event
       └─ Session destroy detection via sessions_v2 DELETE event

Supabase Storage
  └─ session_files bucket          ← File uploads scoped by session

Supabase Edge Functions (Deno)
  ├─ create-session                ← Validates and creates new sessions
  ├─ join-session                  ← Validates passcode and registers device
  └─ delete-expired-sessions       ← Cron: purges expired sessions every 5 min
```

> [!IMPORTANT]
> All encryption and decryption happens exclusively in the browser. The PBKDF2-derived AES key is never transmitted to any server.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- Supabase CLI (optional, for Edge Functions)

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**

2. In the SQL Editor, run the migration:
   - `supabase/migrations/003_v2_schema.sql`
   
   This creates all required tables: `sessions_v2`, `devices`, `clipboard_items`, `messages_v2`, `secrets`, `files`, `security_events`.

3. Enable Realtime on all tables:
   - Dashboard → **Database → Replication → supabase_realtime**
   - Enable for: `sessions_v2`, `devices`, `clipboard_items`, `messages_v2`, `secrets`, `files`, `security_events`

4. Create a Storage bucket:
   - Dashboard → **Storage → New Bucket**
   - Name: `session_files`
   - Toggle: **Public bucket** ✅

5. Copy your credentials:
   - Dashboard → **Project Settings → API**
   - Copy **Project URL** and **anon public** key

### 2. Configure Environment

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**

### 4. Cross-Device Testing (Same Wi-Fi)

```bash
npm run dev -- --host
```

Find your local IP (`ipconfig` on Windows, `ifconfig` on macOS/Linux) and open `http://192.168.x.x:5173` on any device on the same network.

> [!NOTE]
> The Clipboard API requires HTTPS. On local HTTP, copy buttons automatically fall back to `document.execCommand` so everything still works.

---

## 🕒 Supabase Edge Functions

### Deploy Edge Functions

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-session
supabase functions deploy join-session
supabase functions deploy delete-expired-sessions
```

### Schedule Auto-Cleanup (Recommended)

#### Option A — Supabase Dashboard Cron
1. Dashboard → **Edge Functions** → `delete-expired-sessions` → **Schedules**
2. Add schedule: `*/5 * * * *`

#### Option B — External Cron (cron-job.org — Free)
- URL: `POST https://your-project-ref.supabase.co/functions/v1/delete-expired-sessions`
- Header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
- Schedule: every 5 minutes

> [!WARNING]
> Without the cleanup cron running, expired sessions will accumulate in the database. Set up at least one method for production.

---

## 🌐 Vercel Deployment

1. Push to GitHub (the `main` branch).
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Configure build settings:

   | Setting | Value |
   |---|---|
   | Root Directory | `client` |
   | Framework Preset | `Vite` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Deploy. Vercel auto-deploys on every push to `main`.

---

## 📁 File Structure

```text
blinkpaste/
├── client/                                   # Vite + React frontend
│   ├── src/
│   │   ├── App.jsx                           # Router: /, /session/:id, /about, /developer
│   │   ├── lib/
│   │   │   └── supabase.js                   # Supabase client singleton
│   │   ├── pages/
│   │   │   ├── Landing.jsx                   # Create / Join session
│   │   │   ├── Session.jsx                   # Main workspace
│   │   │   ├── About.jsx                     # Platform info page
│   │   │   └── Developer.jsx                 # Developer profile page
│   │   ├── components/
│   │   │   ├── SessionCreatedModal.jsx       # Post-create modal with QR + copy
│   │   │   ├── QRCodeModal.jsx               # QR code overlay
│   │   │   ├── ExpiredModal.jsx              # Session expiry overlay
│   │   │   ├── modules/
│   │   │   │   ├── ClipboardModule.jsx       # Clipboard sync tab
│   │   │   │   ├── MessagesModule.jsx        # Real-time chat tab
│   │   │   │   ├── FilesModule.jsx           # File upload/download tab
│   │   │   │   ├── SecretsModule.jsx         # Secrets vault tab
│   │   │   │   ├── DevicesModule.jsx         # Connected devices + host controls
│   │   │   │   ├── SecurityModule.jsx        # Security audit log tab
│   │   │   │   └── SettingsModule.jsx        # Session settings + danger zone
│   │   │   └── workspace/
│   │   │       ├── Sidebar.jsx               # Navigation sidebar
│   │   │       └── StatusBar.jsx             # Bottom status bar
│   │   └── utils/
│   │       ├── useSessionData.js             # Core Realtime data hook
│   │       ├── encryption.js                 # AES-GCM-256 + PBKDF2 helpers
│   │       ├── clipboard.js                  # Clipboard copy with HTTP fallback
│   │       ├── generateSessionId.js          # Readable session ID generator
│   │       └── sensitiveDetector.js          # Auto-detect sensitive clipboard content
│   ├── index.html
│   └── package.json
│
└── supabase/
    ├── migrations/
    │   └── 003_v2_schema.sql                 # Full v2 database schema
    └── functions/
        ├── create-session/index.ts           # Session creation Edge Function
        ├── join-session/index.ts             # Session join + device register
        └── delete-expired-sessions/index.ts  # Cron cleanup Edge Function
```

---

## 🔒 Security Model

| Layer | Implementation |
|---|---|
| **Key Derivation** | PBKDF2-SHA256, 100,000 iterations, 256-bit output |
| **Encryption** | AES-GCM-256 with random 96-bit IV per item |
| **Key Storage** | In-memory only (React state) — never persisted |
| **Server Storage** | Only ciphertext is stored — server has zero plaintext access |
| **Session Auth** | Passcode-gated — no tokens, no cookies, no accounts |
| **Device Auth** | Unique device ID stored in `sessionStorage` (tab-scoped) |
| **Host Enforcement** | `host_device_id` validated server-side on sensitive actions |
| **Kick Mechanism** | `is_blocked` flag set via DB UPDATE — prevents re-registration |
| **Data Lifetime** | PostgreSQL cascade delete on session expiry |

> [!NOTE]
> The Supabase **anon key** is safe to expose client-side — it is designed for public frontend use with Row Level Security. The **service_role key** is only used in Edge Functions and must never be exposed to the client.

---

## 👨‍💻 Developer

Built by **Aditya Dhembare**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Aditya_Dhembare-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://in.linkedin.com/in/aditya-dhembare)
[![GitHub](https://img.shields.io/badge/GitHub-execute--aditya-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/execute-aditya)

---

<div align="center">
  <sub>© 2026 BlinkPaste — Ephemeral by design. Encrypted by default.</sub>
</div>
