import { loadEnvFile } from "node:process";
import { defineConfig, env } from "@prisma/config";

try {
  loadEnvFile();
} catch (e) {
  // .env file might not exist in production/Vercel
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase memblokir direct connection — pakai pooler (SESSION mode port 5432)
    // untuk CLI push. Runtime app tetap pakai adapter-pg dengan DATABASE_URL.
    url: env("DATABASE_URL"),
  },
});
