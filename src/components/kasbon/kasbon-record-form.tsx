"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { ActionStateFeedback, useActionStateToast } from "@/components/forms/action-state-feedback";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput } from "@/lib/format";
import { initialFormActionState } from "@/server/form-state";
import {
  createKasbonRecordAction,
  updateKasbonRecordAction,
} from "@/server/kasbon/actions";
import type { KasbonRecordFormOptions } from "@/server/kasbon/records";

type FormMode = "create" | "edit";

type KasbonRecordFormProps = {
  employees: KasbonRecordFormOptions["employees"];
  mode: FormMode;
  initialRecord?: {
    id: string;
    employeeId: string;
    tanggal: Date | string;
    nominal: number;
    keterangan: string | null;
  };
};

function getDefaultDateValue() {
  return formatDateInput(new Date());
}

export function KasbonRecordForm({
  employees,
  mode,
  initialRecord,
}: KasbonRecordFormProps) {
  const action = mode === "create" ? createKasbonRecordAction : updateKasbonRecordAction;
  const [state, formAction] = useActionState(action, initialFormActionState);
  
  const [employeeId, setEmployeeId] = useState(initialRecord?.employeeId ?? "");
  const [tanggal, setTanggal] = useState(
    initialRecord ? formatDateInput(initialRecord.tanggal) : getDefaultDateValue(),
  );
  const [nominal, setNominal] = useState(initialRecord?.nominal.toString() ?? "");
  const [keterangan, setKeterangan] = useState(initialRecord?.keterangan ?? "");

  useActionStateToast(state);

  useEffect(() => {
    if (state.status === "success" && mode === "create") {
      setEmployeeId("");
      setTanggal(getDefaultDateValue());
      setNominal("");
      setKeterangan("");
    }
  }, [mode, state.status]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialRecord ? <input name="id" type="hidden" value={initialRecord.id} /> : null}

      <Card className="rounded-[24px] border-border/70 bg-background/70">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="employeeId">
                Karyawan
              </label>
              <Select
                id="employeeId"
                name="employeeId"
                onChange={(event) => setEmployeeId(event.target.value)}
                value={employeeId}
              >
                <option disabled value="">
                  Pilih karyawan
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nama} • {employee.divisi} • {employee.kategori}
                  </option>
                ))}
              </Select>
              <FieldError errors={state.fieldErrors.employeeId} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tanggal">
                Tanggal Kasbon
              </label>
              <Input
                id="tanggal"
                name="tanggal"
                onChange={(event) => setTanggal(event.target.value)}
                type="date"
                value={tanggal}
              />
              <FieldError errors={state.fieldErrors.tanggal} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nominal">
              Nominal (Rp)
            </label>
            <Input
              id="nominal"
              min={1}
              name="nominal"
              onChange={(event) => setNominal(event.target.value)}
              placeholder="0"
              type="number"
              value={nominal}
            />
            <FieldError errors={state.fieldErrors.nominal} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="keterangan">
              Keterangan (Opsional)
            </label>
            <Textarea
              id="keterangan"
              name="keterangan"
              onChange={(event) => setKeterangan(event.target.value)}
              placeholder="Misal: Beli bensin, Pinjaman darurat, dll."
              rows={3}
              value={keterangan}
            />
            <FieldError errors={state.fieldErrors.keterangan} />
          </div>
        </CardContent>
      </Card>

      <ActionStateFeedback state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel={mode === "create" ? "Menyimpan..." : "Memperbarui..."}>
          {mode === "create" ? "Simpan Kasbon" : "Simpan Perubahan"}
        </SubmitButton>

        <Button asChild variant="outline">
          <Link href="/dashboard/admin/kasbon">Kembali ke Daftar Kasbon</Link>
        </Button>
      </div>
    </form>
  );
}
