import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ADMIN_HOME_PATH, EMPLOYEE_HOME_PATH, LOGIN_PATH } from "@/auth/access-control";

export async function requireAdminRequestSession(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return {
      response: NextResponse.redirect(new URL(LOGIN_PATH, request.url)),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      response: NextResponse.redirect(new URL(EMPLOYEE_HOME_PATH, request.url)),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function requireEmployeeRequestSession(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return {
      response: NextResponse.redirect(new URL(LOGIN_PATH, request.url)),
    };
  }

  if (session.user.role !== "KARYAWAN") {
    return {
      response: NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url)),
    };
  }

  return {
    session,
    response: null,
  };
}
