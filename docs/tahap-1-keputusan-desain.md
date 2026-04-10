# Tahap 1 - Keputusan Desain

## 1. Penamaan model vs tabel

- Nama model Prisma memakai bahasa Inggris (`User`, `Employee`, `PerformanceRecord`) supaya layer TypeScript lebih rapi.
- Nama tabel dan kolom tetap `snake_case` melalui `@@map` dan `@map` agar konsisten dengan PostgreSQL/Supabase.

## 2. Strategi identitas user dan employee

- `users` dipakai untuk login dan otorisasi.
- `employees` dipakai untuk data bisnis karyawan.
- Relasi dibuat `1 user : 0..1 employee`.
- `ADMIN` boleh tidak punya `employee`.
- `KARYAWAN` harus punya `employee` agar pembatasan "lihat data diri sendiri" cukup memakai `session.user.id -> employee.user_id`.

## 3. Enum yang dipakai

- `role` dijadikan enum karena nilainya stabil: `ADMIN`, `KARYAWAN`.
- `divisi` dijadikan enum karena nilainya stabil: `TABUNG`, `ASESORIS`, `PACKING`.
- `kategori` sengaja tetap `String`, bukan enum, supaya perubahan label bisnis tidak memaksa migration schema.

## 4. Soft delete

- Soft delete dipakai pada `users`, `products`, `employees`, dan `performance_records`.
- `performance_record_items` tidak memakai soft delete terpisah karena lifecycle-nya mengikuti header.
- Saat record di-soft-delete, item tetap dipertahankan agar histori dan audit tetap utuh.

## 5. Snapshot nominal upah

- `performance_record_items.upah` menyimpan total upah per baris (`qty x upah_satuan`) saat transaksi dibuat.
- Keputusan ini menjaga histori tetap benar walaupun `products.upah_satuan` berubah di masa depan.
- `performance_records.total_upah` disimpan sebagai hasil agregasi semua item untuk mempercepat laporan dan export.

## 6. Unique constraint harian

- Aturan bisnis "1 employee hanya boleh punya 1 record aktif per tanggal" tidak bisa dimodelkan aman hanya dengan `@@unique([employeeId, tanggal, deletedAt])` karena `NULL` pada PostgreSQL tidak dianggap sama.
- Karena itu dipakai partial unique index manual:

```sql
CREATE UNIQUE INDEX uq_performance_records_employee_tanggal_active
ON performance_records (employee_id, tanggal)
WHERE deleted_at IS NULL;
```

- File SQL pendukung disimpan di `prisma/manual_constraints.sql`.

## 7. Audit log

- Audit log hanya dibuat untuk `performance_records` dan `performance_record_items`.
- Tabel `performance_audit_logs` menyimpan:
  - siapa pelaku (`actor_user_id`)
  - tabel target (`target_table`)
  - baris target (`target_id`)
  - snapshot sebelum dan sesudah perubahan (`old_values`, `new_values`)
- Format JSON dipilih agar middleware audit tetap sederhana dan tidak perlu schema log terpisah per tabel.

## 8. Alasan menambahkan tabel Auth.js

- `accounts`, `sessions`, dan `verification_tokens` disiapkan dari awal supaya Tahap 3 bisa langsung memakai Prisma Adapter Auth.js v5.
- `users.password` tetap disimpan karena aplikasi ini akan memakai login internal email/password.

## 9. Keputusan versi Prisma dan koneksi Supabase

- Workspace Anda menjalankan Prisma ORM v7, jadi koneksi database tidak lagi ditulis di `schema.prisma`.
- URL koneksi Prisma CLI dipindahkan ke `prisma.config.ts`.
- Karena target deploy adalah `Vercel + Supabase`, strategi yang dipilih:
  - Prisma CLI memakai `DIRECT_URL` untuk migrate/introspection.
  - Runtime aplikasi nanti memakai pooled `DATABASE_URL`.
  - Prisma Client memakai `provider = "prisma-client"` dengan `engineType = "client"` agar cocok dengan adapter PostgreSQL di tahap setup.
- Referensi resmi Prisma untuk perubahan ini:
  - Upgrade Prisma 7: https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7
  - Prisma config: https://www.prisma.io/docs/orm/reference/prisma-config-reference
  - Prisma + Supabase: https://www.prisma.io/docs/v6/orm/overview/databases/supabase
