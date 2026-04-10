"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import { Upload } from "lucide-react";

import { ActionStateFeedback, useActionStateToast } from "@/components/forms/action-state-feedback";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DIVISIONS } from "@/lib/constants";
import { initialFormActionState } from "@/server/form-state";
import {
  createEmployeeAction,
  importEmployeesAction,
  updateEmployeeAction,
} from "@/server/master-data/employee-actions";
import type { Division } from "@/generated/prisma/enums";

type EditEmployeeFormProps = {
  employee: {
    id: string;
    nama: string;
    divisi: Division;
    kategori: string;
    user: {
      id: string;
      email: string;
    };
  };
};

function ImportHint() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
      Header Excel karyawan:
      <span className="ml-1 font-medium text-foreground">
        <code>nama</code>, <code>email</code>, <code>password</code>, <code>divisi</code>,{" "}
        <code>kategori</code>
      </span>
      <p className="mt-2">
        Password pada file akan langsung di-hash sebelum disimpan ke database.
      </p>
    </div>
  );
}

export function CreateEmployeeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createEmployeeAction, initialFormActionState);

  useActionStateToast(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nama">
            Nama Karyawan
          </label>
          <Input id="nama" name="nama" placeholder="INDRA" />
          <FieldError errors={state.fieldErrors.nama} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email Login
          </label>
          <Input id="email" name="email" placeholder="indra@aquarium.local" type="email" />
          <FieldError errors={state.fieldErrors.email} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password Awal
          </label>
          <Input id="password" name="password" placeholder="minimal 8 karakter" type="password" />
          <FieldError errors={state.fieldErrors.password} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="divisi">
            Divisi
          </label>
          <Select defaultValue="" id="divisi" name="divisi">
            <option disabled value="">
              Pilih divisi
            </option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors.divisi} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="kategori">
            Kategori
          </label>
          <Input id="kategori" name="kategori" placeholder="BAHAN JADI" />
          <FieldError errors={state.fieldErrors.kategori} />
        </div>
      </div>

      <ActionStateFeedback state={state} />

      <SubmitButton>Simpan Karyawan</SubmitButton>
    </form>
  );
}

export function ImportEmployeesForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(importEmployeesAction, initialFormActionState);

  useActionStateToast(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <ImportHint />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="employeeImportFile">
          File Excel
        </label>
        <Input accept=".xlsx,.xls" id="employeeImportFile" name="file" type="file" />
      </div>

      <ActionStateFeedback state={state} />

      <SubmitButton pendingLabel="Mengimpor Karyawan...">
        <Upload />
        Import Karyawan
      </SubmitButton>
    </form>
  );
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const [state, formAction] = useActionState(updateEmployeeAction, initialFormActionState);

  useActionStateToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input name="id" type="hidden" value={employee.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nama">
            Nama Karyawan
          </label>
          <Input defaultValue={employee.nama} id="nama" name="nama" />
          <FieldError errors={state.fieldErrors.nama} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email Login
          </label>
          <Input defaultValue={employee.user.email} id="email" name="email" type="email" />
          <FieldError errors={state.fieldErrors.email} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password Baru
          </label>
          <Input
            defaultValue=""
            id="password"
            name="password"
            placeholder="kosongkan jika tidak diubah"
            type="password"
          />
          <FieldError errors={state.fieldErrors.password} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="divisi">
            Divisi
          </label>
          <Select defaultValue={employee.divisi} id="divisi" name="divisi">
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors.divisi} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="kategori">
            Kategori
          </label>
          <Input defaultValue={employee.kategori} id="kategori" name="kategori" />
          <FieldError errors={state.fieldErrors.kategori} />
        </div>
      </div>

      <ActionStateFeedback state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton>Simpan Perubahan</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/karyawan">Kembali ke Daftar</Link>
        </Button>
      </div>
    </form>
  );
}
