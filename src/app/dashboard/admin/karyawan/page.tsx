import Link from "next/link";

import { PencilLine, RotateCcw, Trash2, UsersRound } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { CreateEmployeeForm, ImportEmployeesForm } from "@/components/master-data/employee-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { archiveEmployeeAction, restoreEmployeeAction } from "@/server/master-data/employee-actions";
import { getEmployeeMasterData } from "@/server/master-data/employees";

export default async function EmployeeMasterPage() {
  const { activeEmployees, archivedEmployees } = await getEmployeeMasterData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Master Karyawan</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Kelola master karyawan</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Setiap karyawan otomatis memiliki akun login dengan role <code>KARYAWAN</code>.
          Soft delete akan mengarsipkan data user dan employee sekaligus.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{activeEmployees.length}</CardTitle>
            <CardDescription>Karyawan aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{archivedEmployees.length}</CardTitle>
            <CardDescription>Karyawan terarsip</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{new Set(activeEmployees.map((employee) => employee.divisi)).size}</CardTitle>
            <CardDescription>Divisi aktif yang terisi</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Karyawan</CardTitle>
            <CardDescription>
              Form ini membuat akun login dan data master karyawan sekaligus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEmployeeForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Excel</CardTitle>
            <CardDescription>
              Import akan membuat, memperbarui, atau memulihkan data karyawan berdasarkan email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportEmployeesForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Karyawan Aktif</CardTitle>
          <CardDescription>Data karyawan yang saat ini dapat login ke sistem.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activeEmployees.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Nama</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Kategori</th>
                  <th className="px-3 py-3 font-medium">Diperbarui</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map((employee) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={employee.id}>
                    <td className="px-3 py-4 font-medium">{employee.nama}</td>
                    <td className="px-3 py-4">{employee.user.email}</td>
                    <td className="px-3 py-4">{employee.divisi}</td>
                    <td className="px-3 py-4">{employee.kategori}</td>
                    <td className="px-3 py-4 text-muted-foreground">{formatDate(employee.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/karyawan/${employee.id}`}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <form action={archiveEmployeeAction}>
                          <input name="id" type="hidden" value={employee.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Arsipkan karyawan ${employee.nama}?`}
                            pendingLabel="Mengarsipkan..."
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
              Belum ada karyawan aktif.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Karyawan Terarsip</CardTitle>
          <CardDescription>
            Data arsip tetap menyimpan hubungan akun login dan bisa dipulihkan kembali.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {archivedEmployees.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Nama</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Kategori</th>
                  <th className="px-3 py-3 font-medium">Dihapus</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {archivedEmployees.map((employee) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={employee.id}>
                    <td className="px-3 py-4 font-medium">{employee.nama}</td>
                    <td className="px-3 py-4">{employee.user.email}</td>
                    <td className="px-3 py-4">{employee.divisi}</td>
                    <td className="px-3 py-4">{employee.kategori}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {employee.deletedAt ? formatDate(employee.deletedAt) : "-"}
                    </td>
                    <td className="px-3 py-4">
                      <form action={restoreEmployeeAction}>
                        <input name="id" type="hidden" value={employee.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Pulihkan karyawan ${employee.nama}?`}
                          pendingLabel="Memulihkan..."
                          size="sm"
                          variant="outline"
                        >
                          <RotateCcw className="h-4 w-4" />
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
              Belum ada karyawan terarsip.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Import</CardTitle>
          <CardDescription>Gunakan header Excel yang konsisten agar import stabil.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-3 rounded-3xl border border-border/80 bg-background/70 p-4">
            <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              File karyawan memakai kolom <code>nama</code>, <code>email</code>,{" "}
              <code>password</code>, <code>divisi</code>, dan <code>kategori</code>. Email
              menjadi kunci sinkronisasi data saat import.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
