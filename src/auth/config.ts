import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

import {
  type AppDivision,
  type AppRole,
  ADMIN_HOME_PATH,
  EMPLOYEE_HOME_PATH,
  LOGIN_PATH,
  isAdminPath,
  isDashboardPath,
  isEmployeePath,
  isLoginPath,
  resolveHomeByRole,
} from "@/auth/access-control";

function parseRole(value: unknown): AppRole {
  return value === "ADMIN" ? "ADMIN" : "KARYAWAN";
}

function parseEmployeeId(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parseDivision(value: unknown): AppDivision | null {
  return value === "TABUNG" || value === "ASESORIS" || value === "PACKING" ? value : null;
}

const authConfig = {
  providers: [],
  pages: {
    signIn: LOGIN_PATH,
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname, search } = request.nextUrl;
      const isAuthenticated = Boolean(auth?.user);

      if (isLoginPath(pathname)) {
        if (!isAuthenticated) {
          return true;
        }

        const destination = resolveHomeByRole(auth!.user.role);
        return NextResponse.redirect(new URL(destination, request.url));
      }

      if (!isDashboardPath(pathname)) {
        return true;
      }

      if (!isAuthenticated) {
        const loginUrl = new URL(LOGIN_PATH, request.url);
        const callbackPath = search ? `${pathname}${search}` : pathname;

        loginUrl.searchParams.set("callbackUrl", callbackPath);

        return NextResponse.redirect(loginUrl);
      }

      const role = auth!.user.role;

      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL(resolveHomeByRole(role), request.url));
      }

      if (isAdminPath(pathname) && role !== "ADMIN") {
        return NextResponse.redirect(new URL(EMPLOYEE_HOME_PATH, request.url));
      }

      if (isEmployeePath(pathname) && role !== "KARYAWAN") {
        return NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.division = user.division;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = parseRole(token.role);
        session.user.employeeId = parseEmployeeId(token.employeeId);
        session.user.division = parseDivision(token.division);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
