# Skenario Belajar: FastAPI + Qdrant

Dokumen ini berisi skenario praktik yang bisa langsung dijalankan.

## Skenario 1 - Seed Data Random

Tujuan: isi collection dengan data dummy agar mudah uji API.

Perintah:

```bash
python scripts/seed_random_posts.py --count 30 --reset
```

Ekspektasi:

- Collection `posts` berisi 30 data post acak.
- Output terminal menampilkan jumlah data yang dibuat.

## Skenario 2 - CRUD Dasar

Tujuan: paham alur create/read/update/delete.

Langkah:

1. Jalankan API.
2. Buka Swagger di `/docs`.
3. Coba endpoint:
   - `POST /api/v1/posts/`
   - `GET /api/v1/posts/`
   - `GET /api/v1/posts/{post_id}`
   - `PUT /api/v1/posts/{post_id}`
   - `DELETE /api/v1/posts/{post_id}`

Ekspektasi:

- Semua endpoint return status code sesuai operasi.
- Data berubah sesuai request.

## Skenario 3 - Semantic Search Top-K

Tujuan: melihat similarity search di Qdrant.

Request contoh mode ORM:

`POST /api/v1/posts/search/semantic/orm`

Body:

```json
{
   "query": "fastapi qdrant",
   "top_k": 5,
   "min_score": 0
}
```

Request contoh mode non-ORM:

`POST /api/v1/posts/search/semantic/non-orm`

Ekspektasi:

- Response mengembalikan maksimal 5 item.
- Setiap item punya field `score`.
- Response punya flag `using_orm` dan `search_mode`.
- Makin relevan query, makin tinggi score.

## Skenario 4 - Unit Test

Tujuan: memastikan logic utama aman sebelum refactor.

Perintah:

```bash
pytest -q
```

Cakupan test saat ini:

- Service layer (`create_post`, `semantic_search`).
- Endpoint semantic search (valid + invalid request).
- Validasi dasar seeder.

## Skenario 5 - Eksperimen Mandiri

Tujuan: mempercepat pemahaman lewat perubahan kecil.

Ide eksperimen:

- Ubah `top_k` dari 3, 5, 10 lalu bandingkan hasil.
- Ubah pola konten di seeder dan lihat ranking search.
- Tambahkan filter tag (next step) di endpoint semantic search.
