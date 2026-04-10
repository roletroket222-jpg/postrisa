import { loadEnvFile } from "node:process";
import { defineConfig, env } from "@prisma/config";

loadEnvFile();

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
