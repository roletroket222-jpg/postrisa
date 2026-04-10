# Tahap 3 - Auth dan Middleware

## Keputusan utama

- Auth memakai `Credentials Provider` dengan `session.strategy = "jwt"`.
- Password disimpan dalam format hash `scrypt$salt$hash`.
- Middleware hanya memakai config edge-safe tanpa query database.
- Proteksi route dipusatkan pada path:
  - `/login`
  - `/dashboard/*`
- Guard server-side dipisah untuk 2 kebutuhan:
  - redirect-based untuk halaman server
  - error-based untuk Server Action

## Alasan JWT

- Credentials provider Auth.js bekerja paling sederhana dan aman bila session memakai JWT.
- Middleware Next.js juga lebih ringan karena cukup membaca token, tanpa akses database di edge runtime.

## Data session yang dipropagasikan

- `session.user.id`
- `session.user.role`
- `session.user.employeeId`
- `session.user.division`

## Aturan redirect

- Belum login ke route dashboard mana pun -> redirect ke `/login?callbackUrl=...`
- Sudah login ke `/login` -> redirect ke dashboard sesuai role
- `KARYAWAN` ke `/dashboard/admin/*` -> redirect ke `/dashboard/karyawan`
- `ADMIN` ke `/dashboard/karyawan/*` -> redirect ke `/dashboard/admin`
