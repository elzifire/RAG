# Testing dan Quality

## Tujuan

Menjaga stabilitas fitur auth, chat, passkey, queue fallback, dan admin panel lewat quality gate yang konsisten.

## Jenis Testing Saat Ini

- Unit test client:
  - store auth
  - composable useApi
- Unit test server:
  - login/register/me/profile
  - passkeys list/delete
- Unit test utils:
  - jwt
  - redis fallback behavior

Lokasi:
- tests/unit/client/*
- tests/unit/server/*
- tests/unit/utils/*

## Command Testing

```bash
npm run test
```

Untuk pre-release:

```bash
npm run test
npm run build
```

## Quality Gate Minimal Sebelum Merge

1. Semua unit test pass.
2. Build production pass.
3. Tidak ada error TypeScript pada file yang diubah.
4. Dokumentasi relevan ikut diupdate.

## Checklist Review Kode

### Security

- Endpoint private sudah lewat middleware auth.
- Endpoint admin memakai requireAdmin.
- Tidak expose secret di response/client runtime public.

### Data Integrity

- Operasi write penting masuk transaction atau punya rollback.
- Perubahan schema disertai migration.
- FK dan unique constraint masih sesuai domain.

### Reliability

- Path error memberikan message jelas.
- Fallback path diuji (Redis down/Ollama down).
- Queue status berakhir di DONE atau FAILED, tidak menggantung.

### API Contract

- Payload request/response konsisten dengan frontend.
- Breaking changes ditandai dan didokumentasikan.

## Test Case Rekomendasi Tambahan

Belum semua area tercakup. Rekomendasi menambah:

1. server/api/chat/send.post.ts
   - validasi ownership session
   - enqueue DB saat Redis error

2. server/api/chat/stream/[sessionId].get.ts
   - claim from DB fallback
   - queue status FAILED on provider error

3. server/api/guest/chat.post.ts
   - mode token dan mode guest
   - rollback counter saat provider fail

4. server/utils/llm.ts
   - provider order openai-first / ollama-first
   - no fallback setelah partial chunk emitted

5. server/utils/chatQueue.ts
   - race condition claim job (updateMany count 0)
   - idempotency by userMessageId

## Manual QA Smoke Test

1. Login normal dan passkey login.
2. Buat chat session, kirim message, stream selesai.
3. Matikan Redis, ulangi chat, pastikan tetap jalan.
4. Simulasikan Ollama down, pastikan fallback provider aktif sesuai policy.
5. Tes guest limit reached.
6. Tes admin create/revoke token akses.
