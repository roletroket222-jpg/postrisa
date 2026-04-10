"use server";

import { signOut } from "@/auth";
import { LOGIN_PATH } from "@/auth/access-control";

export async function logoutAction() {
  await signOut({
    redirectTo: LOGIN_PATH,
  });
}
