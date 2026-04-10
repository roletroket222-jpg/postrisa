import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DIVISIONS } from "@/lib/constants";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/format";
import { getAdminReportData, type ReportSearchParams } from "@/server/reports/performance";

type AdminReportPageProps = {
  searchParams: Promise<ReportSearchParams>;
};

export default async function AdminReportPage({ searchParams }: AdminReportPageProps) {
  const data = await getAdminReportData(await searchParams);
  const exportQuery = new URLSearchParams({
    from: data.filters.from,
    to: data.filters.to,
    ...(data.filters.division ? { division: data.filters.division } : {}),
    ...(data.filters.employeeId ? { employeeId: data.filters.employeeId } : {}),
  }).toString();
  const selectedEmployee = data.employeeOptions.find(
    (employee) => employee.id === data.filters.employeeId,
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge>Laporan & Rekap</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Laporan kinerja harian</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Rekap seluruh karyawan untuk periode{" "}
            <span className="font-medium text-foreground">
              {formatDateOnly(data.filters.fromDate)} sampai {formatDateOnly(data.filters.toDate)}
            </span>
            . Filter berjalan penuh di server agar data konsisten dengan hak akses admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Kembali ke Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/admin/laporan/export?${exportQuery}`}>
              Export Excel
            </Link>
          </Button>
          {selectedEmployee ? (
            <Button asChild variant="outline">
              <Link
                href={`/dashboard/admin/laporan/slip/${selectedEmployee.id}?from=${data.filters.from}&to=${data.filters.to}`}
                target="_blank"
              >
                Slip PDF {selectedEmployee.nama}
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href="/dashboard/admin/kinerja">Input Kinerja</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Filter Laporan</CardTitle>
              <CardDescription>Batasi data berdasarkan tanggal, divisi, atau karyawan.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/laporan">Reset</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr_1.2fr_auto]" method="get">
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
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="division">
                Divisi
              </label>
              <Select defaultValue={data.filters.division ?? ""} id="division" name="division">
                <option value="">Semua divisi</option>
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employeeId">
                Karyawan
              </label>
              <Select defaultValue={data.filters.employeeId ?? ""} id="employeeId" name="employeeId">
                <option value="">Semua karyawan</option>
                {data.employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nama} | {employee.divisi}
                    {employee.isArchived ? " | ARSIP" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full xl:w-auto" type="submit">
                Terapkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(data.summary.totalRecords)}</CardTitle>
            <CardDescription>Total record</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(data.summary.totalEmployees)}</CardTitle>
            <CardDescription>Karyawan terlibat</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(data.summary.totalItems)}</CardTitle>
            <CardDescription>Baris item</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatNumber(data.summary.totalQty)}</CardTitle>
            <CardDescription>Total qty</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(data.summary.totalUpah)}</CardTitle>
            <CardDescription>Total upah</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rekap Per Divisi</CardTitle>
            <CardDescription>Akumulasi output dan nominal upah menurut divisi.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Record</th>
                  <th className="px-3 py-3 font-medium">Qty</th>
                  <th className="px-3 py-3 font-medium">Upah</th>
                </tr>
              </thead>
              <tbody>
                {data.divisionSummary.map((division) => (
                  <tr className="border-b border-border/70 last:border-none" key={division.division}>
                    <td className="px-3 py-4 font-medium">{division.division}</td>
                    <td className="px-3 py-4">{formatNumber(division.employeeCount)}</td>
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
            <CardTitle>Top Produk Periode Ini</CardTitle>
            <CardDescription>Diurutkan berdasarkan akumulasi upah pada periode aktif.</CardDescription>
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
                Tidak ada data produk pada filter ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Per Karyawan</CardTitle>
          <CardDescription>Nominal dan volume kerja setiap karyawan pada periode terpilih.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.employeeSummary.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Record</th>
                  <th className="px-3 py-3 font-medium">Qty</th>
                  <th className="px-3 py-3 font-medium text-primary">Total Kotor</th>
                  <th className="px-3 py-3 font-medium text-destructive">Kasbon</th>
                  <th className="px-3 py-3 font-medium">Upah Bersih</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.employeeSummary.map((employee, index) => (
                  <tr className="border-b border-border/70 last:border-none" key={employee.employeeId}>
                    <td className="px-3 py-4 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-4 font-medium">
                      {employee.nama}
                      {employee.isArchived ? (
                        <span className="ml-2 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                          Terhapus
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4">
                      {employee.divisi}
                    </td>
                    <td className="px-3 py-4">{employee.recordCount} hari</td>
                    <td className="px-3 py-4">{employee.totalQty.toLocaleString("id-ID")} pcs</td>
                    <td className="px-3 py-4 text-primary">{formatCurrency(employee.totalUpah)}</td>
                    <td className="px-3 py-4 text-destructive">{formatCurrency(employee.totalKasbon)}</td>
                    <td className="px-3 py-4 font-bold">{formatCurrency(employee.upahBersih)}</td>
                    <td className="px-3 py-4 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/admin/laporan/${employee.employeeId}?${new URLSearchParams({
                            from: data.filters.from,
                            to: data.filters.to,
                          }).toString()}`}
                          target="_blank"
                        >
                          Rincian & Slip
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Tidak ada data karyawan pada filter ini.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Record</CardTitle>
          <CardDescription>Detail transaksi aktif yang menjadi dasar seluruh rekap di atas.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.records.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Qty</th>
                  <th className="px-3 py-3 font-medium">Upah</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                    <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                    <td className="px-3 py-4">
                      {record.employee.nama} | {record.employee.divisi}
                    </td>
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
              Tidak ada record pada filter ini.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
