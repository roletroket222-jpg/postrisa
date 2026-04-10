# Aquarium Performance

Aplikasi pencatatan kinerja dan penggajian harian pegawai pabrik akuarium.

## Quick Start

1. Install dependency:

```bash
nvm use
npm install
```

2. Sesuaikan nilai pada `.env`.

Contoh lokal PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/aquarium_performance"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/aquarium_performance"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/aquarium_performance_shadow"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="isi-random-string-panjang"
AUTH_TRUST_HOST="true"
```

Jika memakai PostgreSQL lokal, buat dua database:

```sql
CREATE DATABASE aquarium_performance;
CREATE DATABASE aquarium_performance_shadow;
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Jalankan development server:

```bash
npm run dev
```

## Setup Database Lokal

1. Copy `.env.example` menjadi `.env`
2. Pastikan PostgreSQL lokal berjalan di `127.0.0.1:5432`
3. Buat database utama dan shadow
4. Jalankan migration:

```bash
npx prisma format
npx prisma migrate dev --create-only --name init
```

5. Tempel isi `prisma/manual_constraints.sql` ke file migration SQL yang baru dibuat
6. Jalankan migration final:

```bash
npx prisma migrate dev
npm run prisma:generate
```

## Auth Admin Awal

Generate hash password:

```bash
npm run auth:hash -- "admin12345"
```

Lalu buat user admin awal di database atau Prisma Studio dengan format password hash hasil command di atas.

## Scripts

- `npm run auth:hash -- "password"` - generate hash password format scrypt
- `npm run dev` - jalankan Next.js di mode development
- `npm run build` - generate Prisma Client lalu build Next.js
- `npm run lint` - jalankan ESLint
- `npm run typecheck` - jalankan TypeScript strict check
- `npm run prisma:generate` - generate Prisma Client
- `npm run prisma:migrate:create -- --name init` - buat draft migration
- `npm run prisma:migrate:dev` - jalankan migration ke database
- `npm run prisma:studio` - buka Prisma Studio
