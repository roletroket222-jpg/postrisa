import Link from "next/link";
import { notFound } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { KasbonRecordForm } from "@/components/kasbon/kasbon-record-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/format";
import {
  getActiveKasbonRecordById,
  getKasbonRecordFormOptions,
} from "@/server/kasbon/records";

export default async function EditKasbonRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const [{ employees }, record] = await Promise.all([
    getKasbonRecordFormOptions(),
    getActiveKasbonRecordById(recordId),
  ]);

  if (!record) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Badge>Edit Kasbon</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Perbarui data kasbon karyawan</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Anda sedang mengedit kasbon <b>{record.employee.nama}</b> untuk tanggal{" "}
          <b>{formatDateOnly(record.tanggal)}</b>.
        </p>
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Pastikan perubahan nominal sudah sesuai. Nilai terbaru akan otomatis memotong "Total Upah" 
            menjadi "Upah Bersih" pada laporan di periode yang bersangkutan.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit</CardTitle>
          <CardDescription>
            Silakan ubah informasi kasbon di bawah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KasbonRecordForm
            employees={employees}
            initialRecord={{
              id: record.id,
              employeeId: record.employeeId,
              tanggal: record.tanggal,
              nominal: record.nominal,
              keterangan: record.keterangan,
            }}
            mode="edit"
          />
        </CardContent>
      </Card>
    </section>
  );
}
