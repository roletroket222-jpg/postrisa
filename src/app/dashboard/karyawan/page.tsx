import Link from "next/link";

import { ClipboardCheck, ReceiptText, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/format";
import { getEmployeeDashboardData, type ReportSearchParams } from "@/server/reports/performance";

type EmployeeDashboardPageProps = {
  searchParams: Promise<ReportSearchParams>;
};

export default async function EmployeeDashboardPage({
  searchParams,
}: EmployeeDashboardPageProps) {
  const data = await getEmployeeDashboardData(await searchParams);
  const slipHref = `/dashboard/karyawan/slip?from=${data.filters.from}&to=${data.filters.to}`;

  if (!data.employee) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <Badge>KARYAWAN</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Dashboard karyawan</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Akun ini belum terhubung ke data employee. Hubungi admin untuk menyinkronkan akun.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>KARYAWAN</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Dashboard karyawan</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Halo <span className="font-medium text-foreground">{data.session.user.name}</span>. Halaman
          ini bersifat read only dan hanya menampilkan riwayat kerja serta upah milik Anda sendiri.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(data.summary.totalRecords)}</CardTitle>
            <CardDescription>Hari kerja periode dipilih</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">{formatCurrency(data.summary.totalUpah)}</CardTitle>
            <CardDescription>Upah kotor periode ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">{formatCurrency(data.kasbonSummary.totalKasbon)}</CardTitle>
            <CardDescription>Total pinjaman (Kasbon)</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">{formatCurrency(data.summary.totalUpah - data.kasbonSummary.totalKasbon)}</CardTitle>
            <CardDescription>Upah bersih diterima</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profil Karyawan</CardTitle>
            <CardDescription>Data master yang terhubung ke akun login Anda.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="mt-2 font-medium">{data.employee.nama}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Divisi</p>
              <p className="mt-2 font-medium">{data.employee.divisi}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Kategori</p>
              <p className="mt-2 font-medium">{data.employee.kategori}</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Periode laporan</p>
              <p className="mt-2 font-medium">
                {formatDateOnly(data.filters.fromDate)} sampai {formatDateOnly(data.filters.toDate)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Filter Riwayat</CardTitle>
                <CardDescription>Pilih rentang tanggal untuk melihat ringkasan pribadi.</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/karyawan">Reset</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" method="get">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="from">
                  Dari
                </label>
                <Input defaultValue={data.filters.from} id="from" name="from" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="to">
                  Sampai
                </label>
                <Input defaultValue={data.filters.to} id="to" name="to" type="date" />
              </div>
              <div className="flex items-end">
                <Button className="w-full md:w-auto" type="submit">
                  Terapkan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kinerja</CardTitle>
            <CardDescription>Semua record pribadi pada periode yang dipilih.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {data.records.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Tanggal</th>
                    <th className="px-3 py-3 font-medium">Item</th>
                    <th className="px-3 py-3 font-medium">Qty Total</th>
                    <th className="px-3 py-3 font-medium">Upah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) => (
                    <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                      <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {record.items.map((item) => `${item.qty} x ${item.product.namaProduk}`).join(", ")}
                      </td>
                      <td className="px-3 py-4">
                        {formatNumber(record.items.reduce((sum, item) => sum + item.qty, 0))}
                      </td>
                      <td className="px-3 py-4 font-medium">{formatCurrency(record.totalUpah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Tidak ada record pada periode yang dipilih.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terbanyak</CardTitle>
              <CardDescription>Ringkasan produk yang paling sering Anda kerjakan pada periode ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.productSummary.length ? (
                data.productSummary.map((product) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-3xl border border-border/80 bg-background/70 p-4"
                    key={product.productId}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{product.namaProduk}</p>
                      <p className="text-sm text-muted-foreground">{product.divisi}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.totalUpah)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(product.totalQty)} qty
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Belum ada produk pada periode ini.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Akses Slip Gaji</CardTitle>
              <CardDescription>Unduh slip gaji PDF untuk periode yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
                <ClipboardCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="font-medium">Riwayat pribadi</p>
                <p className="mt-1 text-sm text-muted-foreground">Semua record kerja harian Anda.</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
                <Wallet className="mb-3 h-5 w-5 text-primary" />
                <p className="font-medium">Ringkasan upah</p>
                <p className="mt-1 text-sm text-muted-foreground">Total upah per periode, produk, dan qty.</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
                <ReceiptText className="mb-3 h-5 w-5 text-primary" />
                <p className="font-medium">Slip gaji PDF</p>
                <p className="mt-1 text-sm text-muted-foreground">Siap diunduh untuk periode aktif.</p>
                <Button asChild className="mt-4 w-full" size="sm" variant="outline">
                  <Link href={slipHref} target="_blank">
                    Unduh Slip
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
