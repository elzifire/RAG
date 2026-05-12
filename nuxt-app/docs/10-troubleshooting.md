# Troubleshooting

Dokumen ini berisi masalah yang paling sering muncul dan langkah cek cepat.

## 1) Error Authentication required di endpoint private

Gejala:
- API return 401 pada endpoint selain public.

Cek:
1. Pastikan header Authorization: Bearer <token> terkirim.
2. Untuk SSE, pastikan token ada di query string.
3. Pastikan JWT_SECRET di server sama dengan saat token dibuat.

## 2) Guest chat limit cepat habis

Gejala:
- /api/guest/chat return 429 lebih cepat dari ekspektasi.

Cek:
1. Nilai guest_max_messages di app_settings.
2. Mode request:
   - guest cookie mode,
   - token mode via x-access-token.
3. Nilai message_count pada guest_sessions atau unlimited_access.

## 3) Chat stream berhenti di tengah

Gejala:
- Event chunk muncul sebentar lalu error.

Cek:
1. Log provider error di server.
2. Status queue job terakhir di chat_queue_jobs.
3. Koneksi network ke Ollama/OpenAI endpoint.

## 4) Redis mati dan chat terasa lambat

Gejala:
- Tidak ada crash, tapi respons lebih lambat.

Penjelasan:
- Ini expected behavior karena fallback ke DB queue.

Cek:
1. Warning Redis enqueue/dequeue failed di log.
2. Queue job tetap masuk PENDING lalu PROCESSING di DB.

## 5) Model list kosong

Gejala:
- Selector model frontend tidak ada pilihan.

Cek:
1. /api/models response.
2. OLLAMA_API_URL bisa diakses.
3. GROQ_API_KEY tersedia jika ingin fallback model.

## 6) Passkey login gagal challenge expired

Gejala:
- Login verify return challenge expired/not found.

Cek:
1. Waktu antara options dan verify terlalu lama.
2. Redis key challenge masih tersimpan.
3. APP_ORIGIN dan RP ID konsisten.

## 7) Migration error di deploy

Gejala:
- npm run db:migrate gagal.

Cek:
1. DATABASE_URL valid.
2. DB user punya privilege create/alter.
3. Versi migration file urut dan tidak conflict.

## 8) Queue banyak FAILED

Gejala:
- chat_queue_jobs status FAILED meningkat.

Cek:
1. error_text dominan provider mana.
2. endpoint provider timeout atau auth key invalid.
3. apakah terjadi lonjakan traffic.

Mitigasi cepat:
- perbaiki credential/provider.
- retry message dari sisi user.
- buat script retry job FAILED jika dibutuhkan.

## 9) Admin endpoint return 403

Gejala:
- Token valid tapi endpoint admin ditolak.

Cek:
1. role user di payload JWT harus ADMIN.
2. role di tabel users sesuai.
3. token lama mungkin masih berisi role lama, login ulang.

## 10) Data guest tidak update

Gejala:
- Counter guest tidak bertambah/berubah.

Cek:
1. Cookie __ragchat_guest ada dan terkirim.
2. Browser block third-party cookie atau domain mismatch.
3. Pastikan request masuk ke endpoint yang benar (/api/guest/chat).

## Query SQL Cepat untuk Diagnosa

```sql
-- Queue status
select status, count(*)
from chat_queue_jobs
group by status;

-- 20 queue failed terbaru
select id, session_id, user_message_id, error_text, finished_at
from chat_queue_jobs
where status = 'FAILED'
order by finished_at desc
limit 20;

-- Guest usage tertinggi
select fingerprint, message_count, last_message_at
from guest_sessions
order by message_count desc
limit 20;
```
