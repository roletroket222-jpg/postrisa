# Tahap 6 - Dashboard dan Laporan

## Cakupan

- Dashboard admin dengan KPI utama, ringkasan bulan berjalan, dan record terbaru
- Halaman laporan admin dengan filter periode, divisi, dan karyawan
- Dashboard karyawan read only yang hanya menampilkan data pribadi
- Rekap server-side untuk divisi, karyawan, produk, qty, dan total upah

## Route

- `/dashboard/admin`
- `/dashboard/admin/laporan`
- `/dashboard/karyawan`

## Keputusan Teknis

- Laporan dihitung di server dari record yang sudah difilter, lalu diagregasi di TypeScript. Ini sengaja dipilih karena skala aplikasi kecil dan lebih maintainable daripada query agregasi yang kompleks.
- Filter laporan memakai query string `GET`, sehingga hasil bisa di-refresh, dibagikan, dan tetap sederhana tanpa client state tambahan.
- Dashboard karyawan tidak menerima parameter `employeeId` dari URL. Data selalu diambil dari `session.user.employeeId` agar tidak ada celah akses ke data karyawan lain.

## File Inti

- `src/server/reports/performance.ts`
- `src/app/dashboard/admin/page.tsx`
- `src/app/dashboard/admin/laporan/page.tsx`
- `src/app/dashboard/karyawan/page.tsx`
