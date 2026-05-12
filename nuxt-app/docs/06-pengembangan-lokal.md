# Pengembangan Lokal

## Prasyarat

- Node.js 20+
- PostgreSQL 16
- Redis opsional
- Akses Ollama atau OpenAI-compatible API

## Setup Awal

1. Install dependency:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Isi variabel penting di .env:

- DATABASE_URL (primary, disarankan Neon)
- DATABASE_FALLBACK_URL (fallback, biasanya local postgres)
- JWT_SECRET
- APP_ORIGIN
- OLLAMA_API_URL
- GROQ_API_KEY (jika pakai fallback OpenAI-compatible)

4. Jalankan migration:

```bash
npm run db:migrate
```

5. Seed data awal (opsional tapi disarankan):

```bash
npm run db:seed
```

6. Jalankan dev server:

```bash
npm run dev
```

## Command Penting

- Unit test:

```bash
npm run test
```

- Build production check:

```bash
npm run build
```

- Reset database local:

```bash
npm run db:reset
```

- Buka Prisma Studio:

```bash
npm run db:studio
```

## Struktur Kode (Ringkas)

- app/: halaman, komponen, store frontend
- server/api/: endpoint API
- server/utils/: helper domain backend
- server/middleware/: auth gate API
- prisma/: schema + migration + seed
- tests/unit/: unit test client/server/utils

## Workflow Harian

1. Pull latest branch.
2. Jalankan migration terbaru.
3. Jalankan test baseline.
4. Kembangkan fitur di branch terpisah.
5. Tambah/update test.
6. Jalankan test + build.
7. Update dokumentasi di folder docs bila ada perubahan behavior.

## Konvensi Pengembangan

- Gunakan TypeScript ketat.
- Hindari hardcode secret.
- Untuk endpoint private, andalkan middleware auth + guard tambahan.
- Untuk perubahan schema, selalu buat migration.
- Untuk behavior baru pada API, update API spec.

## Tips Debug Cepat

- Cek auth issue lewat inspect Authorization header atau query token SSE.
- Cek queue issue dengan melihat isi chat_queue_jobs.
- Cek provider issue dari log error message (Ollama/OpenAI).
