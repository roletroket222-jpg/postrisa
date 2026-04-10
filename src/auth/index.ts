import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig from "@/auth/config";
import { loginSchema } from "@/auth/validation";
import { prisma } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";

const credentialsProvider = Credentials({
  name: "Email dan Password",
  credentials: {
    email: {
      label: "Email",
      type: "email",
      placeholder: "admin@aquarium.local",
    },
    password: {
      label: "Password",
      type: "password",
      placeholder: "********",
    },
  },
  async authorize(credentials) {
    const parsedCredentials = loginSchema.safeParse(credentials);

    if (!parsedCredentials.success) {
      return null;
    }

    const { email, password } = parsedCredentials.data;

    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        employee: {
          select: {
            id: true,
            divisi: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    if (user.role === "KARYAWAN" && (!user.employee || user.employee.deletedAt)) {
      return null;
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
      division: user.employee?.divisi ?? null,
    };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
});
