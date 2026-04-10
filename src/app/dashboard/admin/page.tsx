import Link from "next/link";

import {
  ArrowRight,
  ClipboardPenLine,
  FileBarChart2,
  Package2,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/format";
import { requireAdminPageSession } from "@/server/auth/session";
import { getAdminDashboardData } from "@/server/reports/performance";

const adminModules = [
  {
    title: "Master Produk",
    description: "Kelola produk aktif dan tarif upah satuan.",
    icon: Package2,
    href: "/dashboard/admin/produk",
  },
  {
    title: "Master Karyawan",
    description: "Kelola akun login dan data karyawan.",
    icon: UsersRound,
    href: "/dashboard/admin/karyawan",
  },
  {
    title: "Pencatatan Kinerja",
    description: "Input dan edit record harian pegawai.",
    icon: ClipboardPenLine,
    href: "/dashboard/admin/kinerja",
  },
  {
    title: "Laporan & Rekap",
    description: "Lihat rekap periode, divisi, dan karyawan.",
    icon: FileBarChart2,
    href: "/dashboard/admin/laporan",
  },
];

export default async function AdminDashboardPage() {
  const [session, dashboard] = await Promise.all([
    requireAdminPageSession(),
    getAdminDashboardData(),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge>ADMIN</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Dashboard admin</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Login sebagai <span className="font-medium text-foreground">{session.user.name}</span>.
            Ringkasan ini menampilkan performa hari ini, akumulasi bulan berjalan, dan akses cepat
            ke seluruh modul admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/kinerja">
              <ClipboardPenLine />
              Input Kinerja
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/admin/laporan">
              <FileBarChart2 />
              Buka Laporan
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(dashboard.activeEmployeeCount)}</CardTitle>
            <CardDescription>Karyawan aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(dashboard.activeProductCount)}</CardTitle>
            <CardDescription>Produk aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(dashboard.todaySummary.totalRecords)}</CardTitle>
            <CardDescription>Record hari ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(dashboard.todaySummary.totalUpah)}</CardTitle>
            <CardDescription>Total upah hari ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(dashboard.currentMonthSummary.totalUpah)}</CardTitle>
            <CardDescription>Upah bulan berjalan</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Bulan Berjalan</CardTitle>
            <CardDescription>
              Periode {formatDateOnly(dashboard.currentMonthFilters.fromDate)} sampai{" "}
              {formatDateOnly(dashboard.currentMonthFilters.toDate)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Total record</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(dashboard.currentMonthSummary.totalRecords)}
              </p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Total qty</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(dashboard.currentMonthSummary.totalQty)}
              </p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Karyawan terlibat</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(dashboard.currentMonthSummary.totalEmployees)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Karyawan Bulan Ini</CardTitle>
            <CardDescription>Diurutkan berdasarkan total upah periode berjalan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.topEmployees.length ? (
              dashboard.topEmployees.map((employee) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-3xl border border-border/80 bg-background/70 p-4"
                  key={employee.employeeId}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{employee.nama}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.divisi} | {employee.kategori}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(employee.totalUpah)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(employee.recordCount)} record
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Belum ada record pada bulan berjalan.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rekap Divisi Bulan Ini</CardTitle>
            <CardDescription>Perbandingan output setiap divisi pada periode berjalan.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Record</th>
                  <th className="px-3 py-3 font-medium">Qty</th>
                  <th className="px-3 py-3 font-medium">Upah</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.divisionSummary.map((division) => (
                  <tr className="border-b border-border/70 last:border-none" key={division.division}>
                    <td className="px-3 py-4 font-medium">{division.division}</td>
                    <td className="px-3 py-4">{formatNumber(division.recordCount)}</td>
                    <td className="px-3 py-4">{formatNumber(division.totalQty)}</td>
                    <td className="px-3 py-4">{formatCurrency(division.totalUpah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modul Admin</CardTitle>
            <CardDescription>Akses cepat ke master data, input, dan laporan.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {adminModules.map(({ title, description, icon: Icon, href }) => (
              <div
                className="flex items-center justify-between gap-4 rounded-3xl border border-border/80 bg-background/70 p-4"
                key={title}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={href}>
                    Buka
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Record Terbaru</CardTitle>
              <CardDescription>Delapan record aktif terakhir dari seluruh divisi.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/laporan">
                <WalletCards />
                Lihat Rekap Lengkap
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {dashboard.recentRecords.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Total Upah</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentRecords.map((record) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                    <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                    <td className="px-3 py-4">
                      {record.employee.nama} | {record.employee.divisi}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {record.items.map((item) => `${item.qty} x ${item.product.namaProduk}`).join(", ")}
                    </td>
                    <td className="px-3 py-4 font-medium">{formatCurrency(record.totalUpah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada record kinerja.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
