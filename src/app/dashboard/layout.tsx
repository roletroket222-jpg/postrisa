import type { ReactNode } from "react";
import Link from "next/link";

import { LayoutDashboard, CalendarDays, Receipt, FileText, UserRound } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedPageSession } from "@/server/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}

async function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const session = await requireAuthenticatedPageSession();
  const isAdmin = session.user.role === "ADMIN";
  const workspaceLabel = isAdmin ? "Workspace Admin" : "Workspace Karyawan";
  const subtitle = isAdmin
    ? "Akses penuh untuk master data, input, dan laporan."
    : "Akses read only untuk riwayat kerja dan slip gaji pribadi.";

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-border/80 bg-card/80 p-4 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.4)] backdrop-blur-sm sm:p-5">
        <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="muted">{workspaceLabel}</Badge>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Aquarium Performance</h1>
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{session.user.role}</Badge>
            {isAdmin ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/admin/kinerja">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Kinerja
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/admin/kasbon">
                    <Receipt className="h-4 w-4 mr-2" />
                    Kasbon
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/admin/laporan">
                    <FileText className="h-4 w-4 mr-2" />
                    Laporan
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/karyawan">
                  <UserRound className="h-4 w-4" />
                  Dashboard Saya
                </Link>
              </Button>
            )}
            <SignOutButton />
            <ThemeToggle />
          </div>
        </header>

        <div className="pt-6">{children}</div>
      </div>
    </main>
  );
}
