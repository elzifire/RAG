# Cara Menambah Fitur

Dokumen ini adalah playbook praktis supaya penambahan fitur konsisten dan minim regressi.

## Checklist Tingkat Tinggi

1. Definisikan use-case dan acceptance criteria.
2. Tentukan dampak ke DB/API/frontend.
3. Implementasi bertahap dari domain backend ke UI.
4. Tambahkan test.
5. Update dokumentasi.

## Template Perencanaan Fitur

Gunakan template ini sebelum mulai:

- Nama fitur:
- Masalah yang diselesaikan:
- User persona:
- API yang berubah/baru:
- Perubahan schema DB:
- Dampak ke auth/role:
- Dampak ke fallback/queue:
- Test plan:
- Rollout plan:

## Urutan Implementasi Disarankan

### 1) Domain dan Data

- Jika perlu tabel/kolom baru, edit prisma/schema.prisma.
- Generate migration baru.
- Pastikan naming konsisten dengan snake_case map bila perlu.

### 2) Utility Layer

- Tambah util baru di server/utils jika logic reusable.
- Hindari logic kompleks langsung di endpoint.

### 3) Endpoint API

- Tambah route file di server/api sesuai resource.
- Terapkan auth rules:
  - public prefix jika memang public,
  - bearer token untuk private,
  - requireAdmin untuk admin-only.
- Validasi input body/query/path.

### 4) Frontend Integration

- Tambah method API wrapper jika pattern berulang.
- Tambah action store (Pinia) untuk state management.
- Hubungkan page/component.

### 5) Error Handling

- Return error message yang actionable.
- Untuk operasi yang update counter atau state, siapkan rollback bila downstream gagal.

### 6) Testing

- Tambah unit test minimum untuk:
  - valid input path,
  - invalid input path,
  - auth failure,
  - edge case utama.

### 7) Dokumentasi

- Update docs/04-api-spec.md bila endpoint berubah.
- Update docs/03-desain-database.md bila schema berubah.
- Update docs/05-alur-chat-dan-fallback.md bila memengaruhi alur chat/fallback.

## Contoh Skenario: Tambah Fitur Rate Limit API

1. Tambah tabel atau field konfigurasi rate limit.
2. Tambah util checker di server/utils.
3. Panggil checker di middleware auth atau endpoint terkait.
4. Return 429 dengan pesan jelas.
5. Tambah test untuk throttle behavior.
6. Dokumentasikan header/rule baru di API spec.

## Contoh Skenario: Tambah Provider AI Baru

1. Extend tipe provider di server/utils/llm.ts.
2. Tambah adapter stream provider baru.
3. Update providerOrder untuk priority policy.
4. Pastikan behavior fallback tetap no-duplication chunk.
5. Tambah observability field provider pada event done/response.
6. Update dokumen alur chat fallback.

## Do and Dont

Do:
- Pecah perubahan besar jadi beberapa PR kecil.
- Jaga backward compatibility bila bisa.
- Tambah migration idempotent dan aman.

Dont:
- Langsung ubah banyak endpoint tanpa test.
- Menaruh business logic kritis di UI.
- Menghapus field DB aktif tanpa rencana migrasi data.
