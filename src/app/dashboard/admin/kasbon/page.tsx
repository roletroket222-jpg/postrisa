import Link from "next/link";

import { PencilLine, RotateCcw, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { KasbonRecordForm } from "@/components/kasbon/kasbon-record-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/format";
import {
  archiveKasbonRecordAction,
  restoreKasbonRecordAction,
} from "@/server/kasbon/actions";
import {
  getKasbonRecordMasterData,
  type KasbonRecordListItem,
} from "@/server/kasbon/records";

export default async function KasbonRecordPage() {
  const { activeRecords, archivedRecords, employees, summary } =
    await getKasbonRecordMasterData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Pencatatan Kasbon</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Input pinjaman / kasbon</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Admin mencatat nominal pinjaman atau pencairan kasbon per karyawan per tanggal. Nilai kasbon 
          akan secara otomatis mengurangi Total Upah Kinerja pada slip gaji dan laporan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{summary.totalRecords}</CardTitle>
            <CardDescription>Record kasbon aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(summary.totalNominal)}</CardTitle>
            <CardDescription>Total nominal seluruhnya</CardDescription>
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
            <CardDescription>Total dicairkan hari ini</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Record Kasbon Baru</CardTitle>
            <CardDescription>
              Pilih karyawan, tanggal pengambilan kasbon, dan masukkan nominal yang dicairkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KasbonRecordForm employees={employees} mode="create" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Panduan Sistem</CardTitle>
            <CardDescription>Informasi penting mengenai kasbon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Nominal kasbon yang diinput di sini akan langsung <b>memotong upah kinerja</b> karyawan yang 
              bersangkutan sesuai tanggal filter laporan gaji.
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Satu karyawan hanya boleh memiliki satu "record kasbon" per tanggal. Jika karyawan ingin
              mencairkan dua kali di hari yang sama, silakan edit (tambahkan jumlahnya) di record aktif.
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/70 p-4">
              Fitur kasbon saat ini mengasumsikan kasbon lunas dan diganti saat penerbitan slip mingguan.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kasbon Aktif</CardTitle>
          <CardDescription>Data pencairan yang valid dan akan terhitung pada laporan pembayaran.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activeRecords.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Nominal Kasbon</th>
                  <th className="px-3 py-3 font-medium">Keterangan</th>
                  <th className="px-3 py-3 font-medium">Dibuat Oleh</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map((record: KasbonRecordListItem) => (
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
                    <td className="px-3 py-4 font-medium text-destructive">{formatCurrency(record.nominal)}</td>
                    <td className="px-3 py-4">{record.keterangan || "-"}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      <div className="space-y-1">
                        <p>{record.createdBy.name ?? "ADMIN"}</p>
                        <p>Dibuat {formatDate(record.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/kasbon/${record.id}`}>
                            <PencilLine />
                            Edit
                          </Link>
                        </Button>
                        <form action={archiveKasbonRecordAction}>
                          <input name="id" type="hidden" value={record.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Batalkan dan arsipkan pencairan kasbon ${record.employee.nama} tanggal ${formatDateOnly(record.tanggal)} sejumlah ${formatCurrency(record.nominal)}?`}
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
              Belum ada pencatatan kasbon.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kasbon Terarsip / Dibatalkan</CardTitle>
          <CardDescription>Record kasbon yang dihapus secara lunak dan tidak dipotong ke upah gaji.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {archivedRecords.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Karyawan</th>
                  <th className="px-3 py-3 font-medium">Nominal</th>
                  <th className="px-3 py-3 font-medium">Dibatalkan</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {archivedRecords.map((record: KasbonRecordListItem) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={record.id}>
                    <td className="px-3 py-4 font-medium">{formatDateOnly(record.tanggal)}</td>
                    <td className="px-3 py-4">
                      {record.employee.nama} | {record.employee.divisi}
                    </td>
                    <td className="px-3 py-4">{formatCurrency(record.nominal)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {record.deletedAt ? formatDate(record.deletedAt) : "-"}
                    </td>
                    <td className="px-3 py-4">
                      <form action={restoreKasbonRecordAction}>
                        <input name="id" type="hidden" value={record.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Pulihkan record kasbon ${record.employee.nama} pada ${formatDateOnly(record.tanggal)}?`}
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
