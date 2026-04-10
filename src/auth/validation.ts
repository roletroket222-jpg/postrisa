import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  callbackUrl: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
