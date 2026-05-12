# Alur Chat dan Fallback

Dokumen ini fokus ke mekanisme chat runtime dan fallback behavior.

## Terminologi

- Provider AI:
  - ollama
  - openai-compatible (Groq/OpenAI endpoint)
- Queue:
  - Redis list chat:queue:<sessionId>
  - DB queue chat_queue_jobs (source of truth)

## Alur Authenticated Chat

### Step-by-step

1. Client kirim POST /api/chat/send.
2. Server validasi session ownership.
3. Server simpan user message ke messages.
4. Server update session model + updatedAt.
5. Server persist queue job ke chat_queue_jobs status PENDING.
6. Server coba rpush payload ke Redis.
7. Client membuka SSE /api/chat/stream/:sessionId?token=...
8. Server stream endpoint claim job:
   - coba lpop Redis lalu claim by userMessageId,
   - jika gagal/tidak ada, claim dari DB pending queue.
9. Server build history dari messages.
10. Server panggil streamChatCompletion priority ollama-first.
11. Setiap chunk dikirim event chunk ke client.
12. Saat done:
    - simpan assistant message,
    - update session updatedAt,
    - update queue DONE,
    - kirim event done.
13. Bila error:
    - update queue FAILED,
    - kirim event error.

## Alur Public/Guest Chat

### Mode guest cookie

- Session diidentifikasi fingerprint cookie __ragchat_guest.
- Counter di guest_sessions.message_count.

### Mode x-access-token

- Jika header x-access-token valid, limit berdasarkan unlimited_access.
- Counter di unlimited_access.message_count.

### Provider priority

- Public/guest selalu openai-first.
- Jika openai gagal sebelum mengeluarkan chunk, fallback ke ollama.
- Jika provider gagal setelah sebagian chunk keluar, request dianggap gagal untuk mencegah output duplikat/campur.

## Provider Routing Rules

Implementasi ada di server/utils/llm.ts:

- streamChatCompletion({ priority })
  - openai-first => [openai, ollama] bila key tersedia.
  - ollama-first => [ollama, openai] bila key tersedia.
- generateChatReply dipakai mode non-SSE (guest chat), return reply penuh.

## Queue Reliability Rules

Implementasi ada di server/utils/chatQueue.ts:

- enqueue selalu tulis DB dulu.
- Redis hanya best-effort acceleration.
- dequeue mencoba Redis dulu untuk latency, lalu fallback DB untuk durability.
- claim job menggunakan compare-and-set via updateMany status=PENDING.

## Failure Scenarios

### Redis down

Dampak:
- Queue tetap jalan lewat DB.

Indikator:
- log warning Queue Redis enqueue/dequeue failed.

### Ollama down

Dampak:
- Auth chat fallback ke OpenAI-compatible.
- Guest chat biasanya langsung OpenAI (jadi tetap normal).

### OpenAI key tidak ada

Dampak:
- Fallback OpenAI tidak aktif.
- Sistem hanya bisa pakai Ollama.

### Kedua provider mati

Dampak:
- endpoint me-return error 502 AI service error.
- queue job ditandai FAILED.

## Monitoring yang Disarankan

- Hitung queue job by status (PENDING/PROCESSING/FAILED).
- Alert jika FAILED naik tajam.
- Alert jika PENDING menumpuk > threshold.
- Log provider usage ratio ollama vs openai.

## Improvement Backlog

- Tambah retry policy untuk queue FAILED.
- Tambah dead-letter queue table.
- Tambah timeout per provider dan circuit breaker.
- Tambah endpoint observability admin untuk queue health.
