# API Specification

Semua endpoint berada di prefix /api.

## Aturan Auth Global

- Public routes:
  - /api/auth/login
  - /api/auth/register
  - /api/auth/passkey/login-options
  - /api/auth/passkey/login-verify
  - /api/models/*
  - /api/guest/*
- Selain itu wajib token JWT.
- Untuk SSE chat stream, token dikirim via query parameter token.

## Format Error Umum

- Status code HTTP sesuai error.
- Body error mengikuti createError H3 (umumnya ada message).

## Auth Endpoints

### POST /api/auth/register

Tujuan:
- Registrasi user baru.

Body:
- email: string
- name: string
- password: string (min 8)

Response 200:
- token
- user { id, email, name, role }

Catatan:
- Jika Neon Auth aktif, endpoint ini akan signup ke Neon lalu mengembalikan access token Neon.

### POST /api/auth/login

Tujuan:
- Login dengan email/password.

Body:
- email
- password

Response 200:
- token
- user { id, email, name, role }

Catatan:
- Jika Neon Auth aktif, endpoint ini memakai password login Neon dan token yang dikembalikan adalah token Neon.

### GET /api/auth/neon/config

Tujuan:
- Mendapatkan status integrasi Neon Auth di frontend.

Response 200:
- enabled: boolean
- providers: string[]

### GET /api/auth/neon/oauth-url

Query:
- provider: string (misal google, github)
- redirectTo: string

Tujuan:
- Menghasilkan URL redirect OAuth provider via Neon Auth.

Response 200:
- provider
- url

### POST /api/auth/neon/session

Body:
- accessToken: string

Tujuan:
- Sinkronisasi token OAuth Neon ke session aplikasi (mapping user lokal + role).

Response 200:
- token
- user { id, email, name, role }

### GET /api/auth/me

Auth:
- Bearer JWT

Response 200:
- { id, email, name, role }

### PATCH /api/auth/profile

Auth:
- Bearer JWT

Body:
- name?: string
- currentPassword?: string
- newPassword?: string

Catatan:
- currentPassword wajib jika newPassword diisi.

Response 200:
- user updated { id, email, name, role }

## Passkey Endpoints

### POST /api/auth/passkey/login-options

Tujuan:
- Generate challenge autentikasi passkey.

Body:
- email?: string

Response 200:
- object options dari SimpleWebAuthn.

### POST /api/auth/passkey/login-verify

Tujuan:
- Verifikasi response autentikasi passkey.

Body:
- AuthenticationResponseJSON

Response 200:
- token
- user { id, email, name, role }

### POST /api/auth/passkey/register-options

Auth:
- Bearer JWT

Tujuan:
- Generate challenge registrasi passkey.

Response 200:
- object options dari SimpleWebAuthn.

### POST /api/auth/passkey/register-verify

Auth:
- Bearer JWT

Body:
- RegistrationResponseJSON

Response 200:
- { verified: true }

### GET /api/auth/passkeys

Auth:
- Bearer JWT

Response 200:
- list passkeys milik user.

### DELETE /api/auth/passkeys/:id

Auth:
- Bearer JWT

Response 200:
- { success: true }

## Chat Authenticated Endpoints

### GET /api/chat/sessions

Auth:
- Bearer JWT

Response 200:
- list session user:
  - id
  - name
  - model
  - createdAt
  - updatedAt
  - messageCount
  - lastMessage

### POST /api/chat/sessions

Auth:
- Bearer JWT

Body:
- model: string
- name?: string

Response 200:
- session baru.

### DELETE /api/chat/sessions/:id

Auth:
- Bearer JWT

Response 200:
- { success: true }

### GET /api/chat/sessions/:id/messages

Auth:
- Bearer JWT

Response 200:
- list message session sorted asc.

### POST /api/chat/send

Auth:
- Bearer JWT

Body:
- sessionId: string
- content: string
- model: string

Behavior:
- Simpan user message ke DB.
- Update model session.
- Persist queue job ke DB.
- Push payload ke Redis jika tersedia.

Response 200:
- { messageId, sessionId }

### GET /api/chat/stream/:sessionId?token=JWT

Auth:
- Query token

Protocol:
- SSE events: chunk, done, error

Event data:
- chunk: { content }
- done: { messageId, sessionId, provider }
- error: { message }

Behavior:
- Claim queue job (Redis first, DB fallback)
- Stream LLM (ollama-first)
- Persist assistant message + update queue status

## Guest/Public Endpoints

### GET /api/guest/session

Tujuan:
- Ambil status limit guest.

Mode:
- Jika ada header x-access-token valid: mode token.
- Jika tidak: mode guest fingerprint cookie.

Response 200:
- enabled
- limit
- count
- remaining
- exhausted
- mode (token|guest)

### POST /api/guest/chat

Tujuan:
- Kirim pesan demo public.

Body:
- message: string
- history?: [{ role, content }]

Header opsional:
- x-access-token

Behavior:
- Cek enabled + limit.
- Increment counter.
- Generate reply via openai-first fallback.
- Rollback counter jika provider error.

Response 200:
- reply
- count
- remaining
- exhausted
- mode
- provider

### GET /api/models

Tujuan:
- Daftar model untuk selector frontend.

Behavior:
- Coba fetch model dari Ollama.
- Jika gagal dan OpenAI configured, return fallback synthetic model.

## Admin Endpoints

Semua endpoint admin wajib:
- Bearer JWT
- role ADMIN

### GET /api/admin/users
- List semua user.

### POST /api/admin/users
- Create user baru.

Body:
- name
- email
- password
- role?: USER|ADMIN

### PATCH /api/admin/users/:id
- Update data user.

### DELETE /api/admin/users/:id
- Soft rule: admin tidak bisa hapus akun sendiri.

### GET /api/admin/settings
- Ambil map app settings.

### PATCH /api/admin/settings
- Upsert key-value setting.

Body:
- key
- value

### GET /api/admin/guests
- Ringkasan statistik guest + recent guest sessions.

### GET /api/admin/tokens
- List token akses guest.

### POST /api/admin/tokens
- Generate token akses baru.

Body:
- label?
- messageLimit
- expiredAt?

### DELETE /api/admin/tokens/:id
- Menonaktifkan token (isActive=false).
- Response no-content.

## Catatan Versioning

Saat ini API belum menggunakan prefix versi (misal /v1).
Disarankan menambah versioning jika akan ada breaking change.

## Internal Endpoints

### GET /api/internal/db-connection

Auth:
- Bearer JWT
- Role ADMIN

Tujuan:
- Menampilkan status koneksi database aktif (primary/fallback) dan hasil ping realtime.

Response 200/503:
- checkedAt
- latencyMs
- pingOk
- pingError
- primaryMaskedUrl
- fallbackMaskedUrl
- fallbackConfigured
- activeSource
- activeMaskedUrl
- initialized
- lastError
- lastCheckedAt
