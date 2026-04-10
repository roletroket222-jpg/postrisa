# Tahap 2 - Struktur Folder

```text
.
|-- docs/
|-- prisma/
|-- src/
|   |-- app/
|   |   |-- dashboard/
|   |   |-- login/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- providers/
|   |   |-- ui/
|   |   `-- theme-toggle.tsx
|   |-- generated/
|   |-- lib/
|   |-- server/
|   |   `-- db/
|   `-- types/
|-- .env.example
|-- components.json
|-- eslint.config.mjs
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
|-- prisma.config.ts
`-- tsconfig.json
```

## Catatan

- `src/app` menyimpan seluruh route App Router.
- `src/components/ui` dipakai untuk komponen gaya shadcn/ui.
- `src/server` dipakai untuk kode server-only seperti Prisma client, auth, dan server actions.
- `src/lib` dipakai untuk helper umum, constant, dan parser env.
- `src/generated` adalah output Prisma Client dan tidak di-commit.
