# RAG Chatbot — Nuxt 4

A full-stack RAG chatbot powered by Nuxt 4, Ollama/OpenAI-compatible APIs, PostgreSQL, and Redis.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Nuxt 4 (SSR disabled on chat page) |
| UI | DaisyUI 5 + Tailwind CSS |
| State | Pinia |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | PostgreSQL 16 |
| Queue | Redis (optional) + PostgreSQL queue fallback |
| Auth | JWT (jose) + WebAuthn / Passkey |
| AI | Ollama with OpenAI-compatible fallback |

## Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally
- Redis (optional — queue continues via PostgreSQL when unavailable)
- Ollama instance (remote or local)
- OpenAI-compatible API key (Groq/OpenAI/etc.) for fallback/public path

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Environment Variables (`.env`)

```env
# Ollama
OLLAMA_API_URL=https://your-ollama-host.example.com

# OpenAI-compatible fallback (Groq/OpenAI/etc.)
GROQ_API_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=your_api_key
GROQ_MODEL=llama-3.1-8b-instant

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ragdb
DATABASE_USER=your_pg_user
DATABASE_PASSWORD=your_pg_password

# Redis (optional acceleration; DB queue remains source of truth)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=change_me_min_32_chars_in_production!!
JWT_EXPIRES_IN=7d

# WebAuthn origin (must match your app URL)
APP_ORIGIN=http://localhost:3000
```

## Database

```bash
# Run migrations
npm run db:migrate

# Run migrations with reset table
npm run db:reset

# Seed default accounts (admin + demo)
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

Default seeded accounts:

| Email | Password | Role |
|---|---|---|
| `admin@ragchat.local` | `Admin@1234!` | ADMIN |
| `demo@ragchat.local` | `Demo@1234!` | USER |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Production Build

```bash
npm run build
npm run preview
```

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create account |
| `POST` | `/api/auth/login` | Public | Login → JWT |
| `GET` | `/api/auth/me` | Bearer | Current user info |
| `POST` | `/api/auth/passkey/login-options` | Public | WebAuthn auth challenge |
| `POST` | `/api/auth/passkey/login-verify` | Public | Verify passkey → JWT |
| `POST` | `/api/auth/passkey/register-options` | Bearer | Generate registration challenge |
| `POST` | `/api/auth/passkey/register-verify` | Bearer | Save passkey credential |
| `GET` | `/api/models` | Public | List Ollama models (fallback OpenAI model if Ollama down) |
| `GET` | `/api/chat/sessions` | Bearer | List user's sessions |
| `POST` | `/api/chat/sessions` | Bearer | Create session |
| `DELETE` | `/api/chat/sessions/:id` | Bearer | Delete session |
| `GET` | `/api/chat/sessions/:id/messages` | Bearer | Get session messages |
| `POST` | `/api/chat/send` | Bearer | Send message (persist queue in DB, push Redis when available) |
| `GET` | `/api/chat/stream/:sessionId` | `?token=` | SSE stream (Ollama-first, OpenAI fallback) |

## Features

- Multi-session chat with history persisted to PostgreSQL
- Model selector (deepseek-coder, gemma4, qwen2.5-coder, glm4)
- Per-code-block copy button with language label
- HTML code block live preview (sandboxed iframe)
- Share message via anchor link
- Model badge per message (hidden dev feature — toggle via message footer)
- Passkey / WebAuthn login
- Resilient queue (Redis optional, PostgreSQL fallback queue)
- Provider fallback policy: authenticated/admin -> Ollama-first, public/guest -> OpenAI-first
- Dark / light theme toggle

## Documentation

Dokumentasi teknis lengkap tersedia di folder [docs](docs/README.md), termasuk:

- Arsitektur sistem
- ERD dan desain database
- API specification
- Alur fallback provider dan queue
- Panduan pengembangan fitur baru
- Testing, deployment, dan troubleshooting

