# Dokumentasi Teknis RAG Chatbot

Dokumentasi ini dibuat per file supaya gampang dicari saat onboarding, debugging, dan pengembangan fitur baru.

## Peta Dokumen

1. [01-arsitektur-sistem.md](01-arsitektur-sistem.md)
   Gambaran arsitektur frontend, backend, storage, AI provider, dan alur request utama.

2. [02-erd.md](02-erd.md)
   ERD relasi tabel utama beserta catatan cardinality.

3. [03-desain-database.md](03-desain-database.md)
   Spesifikasi tabel, field penting, index, enum, dan lifecycle data.

4. [04-api-spec.md](04-api-spec.md)
   Spesifikasi endpoint API yang dipakai aplikasi.

5. [05-alur-chat-dan-fallback.md](05-alur-chat-dan-fallback.md)
   Alur chat end-to-end termasuk fallback provider AI dan fallback queue Redis ke database.

6. [06-pengembangan-lokal.md](06-pengembangan-lokal.md)
   Panduan setup local dev, workflow harian, dan command penting.

7. [07-menambah-fitur.md](07-menambah-fitur.md)
   Playbook saat menambah fitur baru (DB, API, store, UI, test, docs).

8. [08-testing-dan-quality.md](08-testing-dan-quality.md)
   Standar testing, checklist quality gate, dan strategi regresi.

9. [09-deploy-operasional.md](09-deploy-operasional.md)
   Runbook deploy, observability, dan maintenance operasional.

10. [10-troubleshooting.md](10-troubleshooting.md)
    Kumpulan masalah umum dan langkah penyelesaian cepat.

## Urutan Baca yang Disarankan

1. Mulai dari arsitektur dan ERD.
2. Lanjut ke API spec dan alur chat fallback.
3. Saat ngoding, pakai panduan pengembangan dan menambah fitur.
4. Saat rilis, pakai deployment dan troubleshooting.
