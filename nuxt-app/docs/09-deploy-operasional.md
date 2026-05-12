# Deploy dan Operasional

## Tujuan

Runbook ini dipakai saat deploy ke environment staging/production.

## Environment Variables Wajib

- DATABASE_URL (primary database)
- DATABASE_FALLBACK_URL (fallback database)
- JWT_SECRET
- JWT_EXPIRES_IN
- APP_ORIGIN
- OLLAMA_API_URL

## Environment Variables Opsional tapi Disarankan

- REDIS_HOST
- REDIS_PORT
- REDIS_PASSWORD
- GROQ_API_BASE_URL
- GROQ_API_KEY
- GROQ_MODEL atau OPENAI_MODEL

## Urutan Deploy

1. Pull release branch/tag.
2. Install dependency:

```bash
npm install
```

3. Jalankan migration:

```bash
npm run db:migrate
```

4. Build app:

```bash
npm run build
```

5. Jalankan server:

```bash
npm run preview
```

Catatan:
- Sesuaikan dengan process manager (PM2/systemd/container orchestrator).

## Checklist Post-Deploy

1. Endpoint health auth login dan me.
2. Endpoint models mengembalikan model valid.
3. Authenticated chat send + stream sukses.
4. Guest chat path berjalan.
5. Admin panel user/settings/tokens bisa diakses.
6. No spike error di log awal deploy.

## Monitoring Minimum

- HTTP error rate 4xx/5xx per endpoint.
- Latency P95 untuk /api/chat/send dan /api/chat/stream.
- Queue health:
  - jumlah PENDING
  - jumlah FAILED
- Provider health:
  - rasio penggunaan ollama vs openai
  - timeout/error provider

## Backup dan Recovery

### Database

- Backup full harian.
- Backup incremental sesuai SLA.
- Uji restore berkala.

### Redis

- Redis hanya akselerator, bukan source of truth queue.
- Jika Redis hilang, aplikasi harus tetap berjalan dari DB queue.

## Operasional Rutin

- Bersihkan queue jobs FAILED lama (manual script/cron).
- Review token unlimited_access yang expired/nonaktif.
- Audit APP settings secara berkala.
- Rotasi JWT secret dengan prosedur planned downtime atau multi-key strategy.

## Rencana Incident Ringkas

1. Identifikasi dampak: auth, chat, admin, guest.
2. Cek provider status (Ollama/OpenAI).
3. Cek DB dan queue status.
4. Terapkan mitigasi cepat (switch provider, restart service, disable feature sementara).
5. Catat RCA dan action item.
