import type { DefaultSession } from "next-auth";

import type { AppDivision, AppRole } from "@/auth/access-control";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
      employeeId: string | null;
      division: AppDivision | null;
    };
  }

  interface User {
    id: string;
    role: AppRole;
    employeeId: string | null;
    division: AppDivision | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
    employeeId?: string | null;
    division?: AppDivision | null;
  }
}
