# FastAPI + Qdrant CRUD (Belajar Mode)

Project ini dibuat untuk belajar dasar arsitektur **MVC** pakai **FastAPI** dengan database vektor **Qdrant**.
Fokusnya: sederhana, clean, dan gampang dipahami.

## Stack

- FastAPI (framework API)
- Qdrant (vector database)
- Pydantic (validasi schema)
- Uvicorn (ASGI server)

## Catatan Tentang ORM

Qdrant bukan database relasional, jadi tidak punya ORM klasik seperti SQLAlchemy.
Di project ini kita pakai pendekatan **ORM-like** lewat model `PostORM` untuk memetakan data aplikasi ke format point Qdrant.

## Struktur Arsitektur (MVC)

```text
app/
  controllers/   -> endpoint HTTP (View + Controller)
  services/      -> business logic
  repositories/  -> akses data ke Qdrant
  models/        -> schema API dan model ORM-like
  core/          -> config dan koneksi/inisialisasi Qdrant
  utils/         -> helper (vectorizer)
  main.py        -> entrypoint FastAPI
```

## Cara Menjalankan

1. Aktifkan virtual environment Anda.
2. Buat file environment dari template:

```bash
copy .env.example .env
```

3. Install dependency:

```bash
pip install -r requirement.txt
```

4. Pastikan Qdrant aktif di:

```text
http://localhost:6333
```

5. Jalankan server:

```bash
uvicorn app.main:app --reload
```

6. Buka dokumentasi Swagger:

```text
http://127.0.0.1:8000/docs
```

## Endpoint CRUD Post

- `POST /api/v1/posts/` buat post baru
- `GET /api/v1/posts/` list post
- `POST /api/v1/posts/search/semantic/orm` semantic search mode ORM (body payload)
- `POST /api/v1/posts/search/semantic/non-orm` semantic search mode non-ORM (body payload)
- `GET /api/v1/posts/{post_id}` detail post
- `PUT /api/v1/posts/{post_id}` update post
- `DELETE /api/v1/posts/{post_id}` hapus post

## Contoh Request: Semantic Search (ORM)

```http
POST /api/v1/posts/search/semantic/orm
Content-Type: application/json

{
  "query": "fastapi qdrant",
  "top_k": 5,
  "min_score": 0
}
```

## Contoh Request: Semantic Search (Non-ORM)

```http
POST /api/v1/posts/search/semantic/non-orm
Content-Type: application/json

{
  "query": "fastapi qdrant",
  "top_k": 5,
  "min_score": 0
}
```

Field flag di response:

- `using_orm: true/false`
- `search_mode: orm/non_orm`

## Kenapa Score Bisa Minus?

Similarity default yang dipakai adalah cosine. Rentangnya dari `-1` sampai `1`:

- `1` artinya sangat mirip
- `0` artinya tidak terlalu berkaitan
- nilai negatif artinya arah vektor berlawanan

Jadi score minus itu valid. Kalau ingin hasil lebih ketat, isi `min_score` misalnya `0` atau `0.2`.

Catatan: project ini masih pakai vectorizer hash sederhana untuk pembelajaran, jadi kualitas semantic ranking belum seakurat embedding model sungguhan.

## Seeder Random Data

Isi data random agar cepat latihan:

```bash
python scripts/seed_random_posts.py --count 30 --reset
```

Opsi penting:

- `--count` jumlah post yang dibuat
- `--seed` angka seed random agar reproducible
- `--reset` hapus collection lalu seed ulang

## Unit Test

Jalankan semua test:

```bash
pytest -q
```

Detail skenario praktik ada di file `SCENARIO.md`.

## Contoh Request: Create Post

```json
{
  "title": "Belajar Qdrant",
  "content": "Hari ini saya mulai belajar FastAPI + Qdrant.",
  "tags": ["fastapi", "qdrant", "belajar"]
}
```

## Catatan Learning

`text_to_vector` di project ini memakai pendekatan hash sederhana agar project bisa langsung jalan tanpa service embedding eksternal.
Untuk production, ganti dengan embedding model sungguhan (misalnya OpenAI, sentence-transformers, atau model lokal).
