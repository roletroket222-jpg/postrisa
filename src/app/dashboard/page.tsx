import { redirect } from "next/navigation";

import { resolveHomeByRole } from "@/auth/access-control";
import { requireAuthenticatedPageSession } from "@/server/auth/session";

export default async function DashboardIndexPage() {
  const session = await requireAuthenticatedPageSession();

  redirect(resolveHomeByRole(session.user.role));
}
