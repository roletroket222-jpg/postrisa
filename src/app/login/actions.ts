"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { DASHBOARD_ROOT_PATH } from "@/auth/access-control";
import { loginSchema } from "@/auth/validation";

export type LoginActionState = {
  error: string | null;
  fieldErrors: {
    email?: string[];
    password?: string[];
  };
};

const initialLoginActionState: LoginActionState = {
  error: null,
  fieldErrors: {},
};

function resolveSafeRedirectPath(callbackUrl?: string) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return DASHBOARD_ROOT_PATH;
  }

  return callbackUrl;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsedCredentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsedCredentials.success) {
    return {
      error: "Periksa kembali email dan password Anda.",
      fieldErrors: parsedCredentials.error.flatten().fieldErrors,
    };
  }

  const { callbackUrl, email, password } = parsedCredentials.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: resolveSafeRedirectPath(callbackUrl),
    });

    return initialLoginActionState;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          error: "Email atau password tidak valid.",
          fieldErrors: {},
        };
      }

      return {
        error: "Gagal masuk ke sistem. Coba lagi.",
        fieldErrors: {},
      };
    }

    throw error;
  }
}
