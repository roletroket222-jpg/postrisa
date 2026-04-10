import Link from "next/link";

import { ClipboardPenLine, PencilLine, RotateCcw, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { PerformanceRecordForm } from "@/components/performance/performance-record-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/format";
import {
  archivePerformanceRecordAction,
  restorePerformanceRecordAction,
} from "@/server/performance/record-actions";
import {
  getPerformanceRecordMasterData,
  type PerformanceRecordListItem,
} from "@/server/performance/records";

export default async function PerformanceRecordPage() {
  const { activeRecords, archivedRecords, employees, products, summary } =
    await getPerformanceRecordMasterData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Pencatatan Kinerja</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Input kinerja harian pegawai</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Admin menginput satu record per karyawan per tanggal, dengan banyak item produk di
          dalamnya. Total upah dihitung otomatis dari master produk aktif.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{summary.totalRecords}</CardTitle>
            <CardDescription>Record aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{summary.recordsToday}</CardTitle>
            <CardDescription>Record hari ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(summary.totalToday)}</CardTitle>
            <CardDescription>Total upah hari ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{archivedRecords.length}</CardTitle>
            <CardDescription>Record terarsip</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Record Harian</CardTitle>
            <CardDescription>
              Pilih karyawan, tanggal kerja, lalu tambahkan produk yang dikerjakan pada hari itu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceRecordForm employees={employees} mode="create" products={products} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aturan Input</CardTitle>
            <CardDescription>Aturan penting agar transaksi tetap konsisten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Satu karyawan hanya boleh memiliki satu record aktif per tanggal.
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Satu produk sebaiknya hanya muncul sekali dalam satu record. Jika qty bertambah,
              gabungkan pada item yang sama.
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Upah item disimpan sebagai snapshot hasil <code>qty x upah_satuan</code> saat record
              dibuat atau diperbarui.
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-border/80 bg-background/70 p-4">
              <ClipboardPenLine className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                Perubahan record dan item otomatis masuk ke audit log khusus tabel{" "}
                <code>performance_records</code> dan <code>performance_record_items</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Aktif</CardTitle>
          <CardDescription>Record harian yang saat ini dipakai untuk laporan dan penggajian.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activeRecords.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Total Upah</th>
                  <th className="px-3 py-3 font-medium">Dibuat Oleh</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map((record: PerformanceRecordListItem) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                    <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <p className="font-medium">{record.employee.nama}</p>
                        <p className="text-muted-foreground">
                          {record.employee.divisi} | {record.employee.kategori}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1 text-muted-foreground">
                        {record.items.map((item) => (
                          <p key={item.id}>
                            {item.qty} x {item.product.namaProduk}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 font-medium">{formatCurrency(record.totalUpah)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      <div className="space-y-1">
                        <p>{record.createdBy.name ?? "ADMIN"}</p>
                        <p>Diperbarui {formatDate(record.updatedAt)}</p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/kinerja/${record.id}`}>
                            <PencilLine />
                            Edit
                          </Link>
                        </Button>
                        <form action={archivePerformanceRecordAction}>
                          <input name="id" type="hidden" value={record.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Arsipkan record ${record.employee.nama} pada ${formatDateOnly(record.tanggal)}?`}
                            pendingLabel="Mengarsipkan..."
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 />
                            Arsipkan
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada record kinerja aktif.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record Terarsip</CardTitle>
          <CardDescription>Soft delete tetap menyimpan detail item dan audit log sebelumnya.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {archivedRecords.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Total Upah</th>
                  <th className="px-3 py-3 font-medium">Dihapus</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {archivedRecords.map((record: PerformanceRecordListItem) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                    <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                    <td className="px-3 py-4">
                      {record.employee.nama} | {record.employee.divisi}
                    </td>
                    <td className="px-3 py-4">{formatCurrency(record.totalUpah)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {record.deletedAt ? formatDate(record.deletedAt) : "-"}
                    </td>
                    <td className="px-3 py-4">
                      <form action={restorePerformanceRecordAction}>
                        <input name="id" type="hidden" value={record.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Pulihkan record ${record.employee.nama} pada ${formatDateOnly(record.tanggal)}?`}
                          pendingLabel="Memulihkan..."
                          size="sm"
                          variant="outline"
                        >
                          <RotateCcw />
                          Pulihkan
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada record terarsip.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
