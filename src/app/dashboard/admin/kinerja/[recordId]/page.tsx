import { notFound } from "next/navigation";

import { PerformanceRecordForm } from "@/components/performance/performance-record-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/format";
import {
  getActivePerformanceRecordById,
  getPerformanceRecordFormOptions,
} from "@/server/performance/records";

type PerformanceRecordEditPageProps = {
  params: Promise<{
    recordId: string;
  }>;
};

export default async function PerformanceRecordEditPage({
  params,
}: PerformanceRecordEditPageProps) {
  const { recordId } = await params;
  const [record, { employees, products }] = await Promise.all([
    getActivePerformanceRecordById(recordId),
    getPerformanceRecordFormOptions(),
  ]);

  if (!record) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Edit Record</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">
          {record.employee.nama} • {formatDateOnly(record.tanggal)}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Total saat ini {formatCurrency(record.totalUpah)}. Terakhir diperbarui pada{" "}
          {formatDate(record.updatedAt)}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Kinerja Harian</CardTitle>
          <CardDescription>
            Perubahan akan menghitung ulang total upah, memperbarui item, dan mencatat audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceRecordForm
            employees={employees}
            initialRecord={{
              id: record.id,
              employeeId: record.employeeId,
              tanggal: record.tanggal,
              items: record.items,
            }}
            mode="edit"
            products={products}
          />
        </CardContent>
      </Card>
    </section>
  );
}
