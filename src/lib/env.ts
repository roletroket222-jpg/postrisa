import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL wajib diisi"),
  SHADOW_DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL harus berupa URL"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).default("true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  });
}
