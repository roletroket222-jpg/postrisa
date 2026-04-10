import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ADMIN_HOME_PATH, EMPLOYEE_HOME_PATH, LOGIN_PATH } from "@/auth/access-control";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getCurrentSession() {
  return auth();
}

export async function requireAuthenticatedPageSession() {
  const session = await auth();

  if (!session?.user) {
    redirect(LOGIN_PATH);
  }

  return session;
}

export async function requireAdminPageSession() {
  const session = await requireAuthenticatedPageSession();

  if (session.user.role !== "ADMIN") {
    redirect(EMPLOYEE_HOME_PATH);
  }

  return session;
}

export async function requireEmployeePageSession() {
  const session = await requireAuthenticatedPageSession();

  if (session.user.role !== "KARYAWAN") {
    redirect(ADMIN_HOME_PATH);
  }

  return session;
}

export async function assertAuthenticatedSession() {
  const session = await auth();

  if (!session?.user) {
    throw new AuthorizationError("UNAUTHENTICATED");
  }

  return session;
}

export async function assertAdminSession() {
  const session = await assertAuthenticatedSession();

  if (session.user.role !== "ADMIN") {
    throw new AuthorizationError("FORBIDDEN");
  }

  return session;
}

export async function assertEmployeeOwnership(employeeId: string) {
  const session = await assertAuthenticatedSession();

  if (session.user.role === "ADMIN") {
    return session;
  }

  if (session.user.employeeId !== employeeId) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return session;
}
