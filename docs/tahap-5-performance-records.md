# Tahap 5 - Pencatatan Kinerja Harian

## Cakupan

- Form header-detail untuk input kinerja harian `ADMIN only`
- Satu `performance_record` aktif per `employee + tanggal`
- Banyak `performance_record_items` dalam satu record
- Hitung `upah` item dan `total_upah` di server
- Edit, arsip, dan restore record harian
- Audit log khusus `performance_records` dan `performance_record_items`

## Route

- `/dashboard/admin/kinerja`
- `/dashboard/admin/kinerja/[recordId]`

## Keputusan Teknis

- `upah` pada `performance_record_items` disimpan sebagai total item (`qty × upah_satuan`) agar histori tidak ikut berubah saat master produk diperbarui.
- Satu produk dibatasi satu kali per record. Jika qty bertambah, qty digabung pada item yang sama.
- Audit log dipusatkan melalui helper middleware domain `withPerformanceAuditMiddleware` agar semua mutation performance konsisten menulis jejak perubahan.
- Soft delete hanya diterapkan pada header `performance_records`. Item tetap dipertahankan dan ikut kembali saat record dipulihkan.

## File Inti

- `src/server/performance/audit.ts`
- `src/server/performance/records.ts`
- `src/server/performance/record-actions.ts`
- `src/components/performance/performance-record-form.tsx`
- `src/app/dashboard/admin/kinerja/page.tsx`
- `src/app/dashboard/admin/kinerja/[recordId]/page.tsx`
