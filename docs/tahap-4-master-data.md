# Tahap 4 - CRUD Master Data + Import Excel

## Cakupan

- CRUD master produk untuk `ADMIN`
- CRUD master karyawan untuk `ADMIN`
- Soft delete dan restore untuk produk dan karyawan
- Import Excel produk dan karyawan
- Validasi input dengan `zod`
- Semua mutation memakai Server Actions dan `assertAdminSession()`

## Keputusan Teknis

- Produk diidentifikasi secara bisnis lewat `namaProduk`. Jika ditemukan data soft delete dengan nama yang sama, sistem akan memulihkan data lama alih-alih membuat duplikat baru.
- Karyawan diidentifikasi saat import lewat `email` karena email dipakai juga untuk login.
- Create dan update karyawan selalu menjaga sinkronisasi antara tabel `users` dan `employees`.
- Password karyawan di-hash di server sebelum disimpan ke database.
- Soft delete karyawan mengarsipkan `users.deletedAt` dan `employees.deletedAt` sekaligus.

## Header Excel

### Produk

- `nama_produk`
- `divisi`
- `upah_satuan`

### Karyawan

- `nama`
- `email`
- `password`
- `divisi`
- `kategori`

## Route Admin

- `/dashboard/admin/produk`
- `/dashboard/admin/produk/[productId]`
- `/dashboard/admin/karyawan`
- `/dashboard/admin/karyawan/[employeeId]`

## File Inti

- `src/server/master-data/products.ts`
- `src/server/master-data/product-actions.ts`
- `src/server/master-data/employees.ts`
- `src/server/master-data/employee-actions.ts`
- `src/components/master-data/product-forms.tsx`
- `src/components/master-data/employee-forms.tsx`
- `src/server/master-data/excel.ts`
