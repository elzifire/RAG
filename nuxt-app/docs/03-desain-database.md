# Desain Database

Dokumen ini menjelaskan desain logis dan operasional database PostgreSQL untuk aplikasi.

## Enum

### Role

- USER
- ADMIN

### MessageRole

- user
- assistant
- system

### QueueJobStatus

- PENDING
- PROCESSING
- DONE
- FAILED

## Tabel Inti

### users

Tujuan:
- Menyimpan akun aplikasi dan role.

Kolom penting:
- id (PK, cuid)
- email (unique)
- name
- password_hash (nullable untuk passkey-only account)
- role
- created_at, updated_at

### passkeys

Tujuan:
- Menyimpan credential WebAuthn per user.

Kolom penting:
- credential_id (unique)
- public_key (bytes)
- counter (anti-replay)
- transports (array)
- user_id FK -> users.id

### chat_sessions

Tujuan:
- Session obrolan per user.

Kolom penting:
- user_id FK -> users.id
- name
- model
- created_at, updated_at

Index:
- (user_id, updated_at desc) untuk list session terbaru.

### messages

Tujuan:
- Menyimpan chat history final per session.

Kolom penting:
- session_id FK -> chat_sessions.id
- role (MessageRole)
- content
- model (nullable pada message user)
- token_count (opsional)
- created_at

Index:
- (session_id, created_at) untuk replay history berurutan.

### chat_queue_jobs

Tujuan:
- Source of truth antrean message processing agar tidak bergantung Redis.

Kolom penting:
- session_id FK -> chat_sessions.id
- user_message_id (unique, menghindari duplikasi job)
- model
- status (QueueJobStatus)
- created_at, started_at, finished_at
- error_text

Index:
- (session_id, status, created_at) untuk claim job pending cepat.

Lifecycle status:
1. PENDING saat enqueue.
2. PROCESSING saat worker stream claim job.
3. DONE jika sukses stream + persist assistant message.
4. FAILED jika provider error atau stream error.

### guest_sessions

Tujuan:
- Counter penggunaan demo berbasis fingerprint cookie.

Kolom penting:
- fingerprint (unique)
- message_count
- last_message_at

### app_settings

Tujuan:
- Konfigurasi global key-value.

Key umum:
- guest_enabled
- guest_max_messages
- guest_default_model

### unlimited_access

Tujuan:
- Token akses guest premium/khusus yang dibuat admin.

Kolom penting:
- token (unique)
- granted_by FK -> users.id (admin)
- expired_at
- is_active
- message_limit, message_count

## Integritas Data

- Semua FK chat session/message/queue menggunakan cascade delete dari parent session.
- user delete akan ikut menghapus passkeys dan chat sessions.
- user_message_id pada queue jobs wajib unique untuk idempotency.

## Strategi Migration

- Selalu buat migration per perubahan schema.
- Jalankan migration sebelum seed atau menjalankan server baru.
- Untuk rollback operasional, siapkan backup DB terlebih dahulu.

## Query Pattern Penting

- List session user: filter by user_id, order updated_at desc.
- Load history session: filter session_id, order created_at asc.
- Claim queue pending: findFirst pending by session, lalu updateMany status check.
- Statistik guest/admin: aggregate count dan sum message_count.

## Risiko dan Mitigasi

- Risiko: queue menumpuk status FAILED.
  Mitigasi: tambahkan job cleanup/retry manual.

- Risiko: growth tabel messages.
  Mitigasi: retention policy, archive, atau partition jika volume tinggi.

- Risiko: token unlimited_access bocor.
  Mitigasi: rotasi token, active flag revoke, audit admin action.
