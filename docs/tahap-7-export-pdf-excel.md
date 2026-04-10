# Tahap 7 - Export PDF dan Excel

## Cakupan

- Export Excel rekap laporan untuk `ADMIN`
- Export PDF slip gaji per karyawan untuk `ADMIN`
- Export PDF slip gaji pribadi untuk `KARYAWAN`
- Route download memakai guard session dan role di sisi server

## Route

- `/dashboard/admin/laporan/export`
- `/dashboard/admin/laporan/slip/[employeeId]`
- `/dashboard/karyawan/slip`

## Keputusan Teknis

- Export tidak memakai Server Action karena ini operasi read/download file, bukan mutation.
- Route handler export tetap dicek session dan role di sisi server, walaupun route sudah berada di bawah middleware `/dashboard/:path*`.
- Excel admin dibuat dari data laporan yang sudah difilter, lalu disusun menjadi beberapa sheet: ringkasan, rekap divisi, rekap karyawan, dan detail record.
- PDF slip gaji memakai snapshot nominal item dari `performance_record_items.upah`, sehingga hasil slip tetap konsisten walau tarif master produk berubah di masa depan.

## File Inti

- `src/server/auth/request.ts`
- `src/server/exports/report-excel.ts`
- `src/server/exports/slip-pdf.tsx`
- `src/app/dashboard/admin/laporan/export/route.ts`
- `src/app/dashboard/admin/laporan/slip/[employeeId]/route.ts`
- `src/app/dashboard/karyawan/slip/route.ts`
