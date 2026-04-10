import { notFound } from "next/navigation";

import { EditEmployeeForm } from "@/components/master-data/employee-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getActiveEmployeeById } from "@/server/master-data/employees";

type EmployeeEditPageProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export default async function EmployeeEditPage({ params }: EmployeeEditPageProps) {
  const { employeeId } = await params;
  const employee = await getActiveEmployeeById(employeeId);

  if (!employee) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Edit Karyawan</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">{employee.nama}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Terakhir diperbarui pada {formatDate(employee.updatedAt)}.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Form Edit Karyawan</CardTitle>
          <CardDescription>
            Perubahan akan memperbarui data employee dan akun login terkait.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditEmployeeForm employee={employee} />
        </CardContent>
      </Card>
    </section>
  );
}
