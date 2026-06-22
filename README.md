# BlinkPaste ⚡

> **Blink. Paste. Gone.**
>
> Instant, ephemeral chat and clipboard sync across any device. No account required. Sessions expire in 60 minutes.

BlinkPaste is a zero-backend-server real-time message feed. Create a session with a custom key, share it with up to 30 devices, and start messaging — everything syncs instantly via Supabase Realtime. Sessions and messages self-destruct after exactly 60 minutes. No recovery. By design.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS v3 |
| **Realtime** | Supabase Realtime (`postgres_changes` + Presence) |
| **Database** | Supabase Postgres |
| **Expiry** | Supabase Edge Function (Deno) |
| **Deployment** | Vercel (frontend) + Supabase (backend) |

---

## 🏗️ Architecture

```text
Browser (React)
  └─ Supabase JS v2
       ├─ sessions & messages tables ← INSERT / SELECT
       └─ Realtime Channel (named after session password)
            ├─ postgres_changes INSERT    → instant message feed sync
            ├─ Broadcast "session_expired" → expired modal display
            ├─ Presence sync/join/leave   → live device count
            └─ postgres_changes DELETE    → expired modal (server-side)

Supabase Edge Function (Deno)
  └─ Runs every 5 min
       ├─ Broadcasts "session_expired" via HTTP Broadcast API
       └─ Deletes expired rows from sessions table (messages cascade delete)
```

**On server restart:** All active sessions are cleared — this is intentional and by design. BlinkPaste has zero persistence.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project** (free, no credit card)

2. In the SQL Editor, run the migrations in order:
   ```text
   supabase/migrations/001_create_sessions.sql
   supabase/migrations/002_create_messages.sql
   ```
   *Note: When running `002_create_messages.sql`, Supabase will show a warning about creating a table without RLS. Click **Run without RLS**.*

3. Enable Realtime on the `sessions` and `messages` tables:
   - Dashboard → **Database → Replication**
   - Under `supabase_realtime`, click **Add table** → select both `sessions` and `messages` → Save

4. Copy your credentials:
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

Find your local IP (`ipconfig` on Windows, `ifconfig | grep inet` on macOS/Linux), then open `http://192.168.x.x:5173` on any device on the same network.

---

## 🕒 Supabase Edge Function Setup

The Edge Function deletes expired sessions every 5 minutes. (Messages are automatically deleted via an `ON DELETE CASCADE` constraint). 

### Option A — Supabase Dashboard Cron (Recommended — free)

1. Deploy the function:
   ```bash
   supabase functions deploy delete-expired-sessions
   ```
2. Dashboard → **Edge Functions** → `delete-expired-sessions` → **Schedules**
3. Add schedule: `*/5 * * * *` (every 5 minutes)

### Option B — External Cron (Free)

Use [cron-job.org](https://cron-job.org):
- URL: `POST https://your-project-ref.supabase.co/functions/v1/delete-expired-sessions`
- Header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
- Schedule: every 5 minutes

> **Note:** Without the Edge Function running, sessions will accumulate in the database indefinitely. For production use, set up at least Option B.

---

## 🌐 Vercel Deployment

1. Push the `client/` directory to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
5. Deploy → your app is live!

---

## 📁 File Structure

```text
blinkpaste/
├── client/                          # Vite + React frontend
│   ├── src/
│   │   ├── App.jsx                  # Router: / and /session/:password
│   │   ├── lib/
│   │   │   └── supabase.js          # Supabase client singleton
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Create / Join session
│   │   │   └── Session.jsx          # Main chat feed + realtime logic
│   │   ├── components/
│   │   │   ├── PasswordCard.jsx     # Session key card
│   │   │   ├── MessageFeed.jsx      # WhatsApp-style chat feed
│   │   │   ├── MessageInput.jsx     # Fixed bottom input bar
│   │   │   ├── DeviceCounter.jsx    # "X devices connected"
│   │   │   ├── TimerBar.jsx         # 60-min countdown
│   │   │   ├── SyncDot.jsx          # Mint blink on sync
│   │   │   └── ExpiredModal.jsx     # Full-screen expiry overlay
│   │   └── utils/
│   │       └── generatePassword.js  
│   ├── index.html
│   ├── vercel.json                  # SPA rewrite rule
│   └── package.json
│
└── supabase/
    ├── migrations/
    │   ├── 001_create_sessions.sql  # sessions table
    │   └── 002_create_messages.sql  # messages table
    └── functions/
        └── delete-expired-sessions/
            └── index.ts             # Deno Edge Function
```

---

## 🔒 Security Notes

- Sessions and messages are ephemeral. Both are deleted permanently from the database at 60 minutes.
- The Supabase **anon key** is safe to expose client-side — it's designed for public frontend use.
- The **service_role key** is only used in the Edge Function (server-side) — never expose it to the client.
