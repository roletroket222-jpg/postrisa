"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CalendarDays, Plus, Trash2 } from "lucide-react";

import { ActionStateFeedback, useActionStateToast } from "@/components/forms/action-state-feedback";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateInput, formatDateOnly } from "@/lib/format";
import { initialFormActionState } from "@/server/form-state";
import {
  createPerformanceRecordAction,
  updatePerformanceRecordAction,
} from "@/server/performance/record-actions";
import type {
  PerformanceRecordEditItem,
  PerformanceRecordFormOptions,
} from "@/server/performance/records";

type FormMode = "create" | "edit";

type RowState = {
  clientId: string;
  itemId?: string;
  productId: string;
  qty: string;
};

type PerformanceRecordFormProps = {
  employees: PerformanceRecordFormOptions["employees"];
  products: PerformanceRecordFormOptions["products"];
  mode: FormMode;
  initialRecord?: {
    id: string;
    employeeId: string;
    tanggal: Date | string;
    items: PerformanceRecordEditItem[];
  };
};

function createRowState(row?: Partial<RowState>): RowState {
  return {
    clientId: crypto.randomUUID(),
    productId: row?.productId ?? "",
    qty: row?.qty ?? "",
    ...(row?.itemId ? { itemId: row.itemId } : {}),
  };
}

function getDefaultDateValue() {
  return formatDateInput(new Date());
}

export function PerformanceRecordForm({
  employees,
  products,
  mode,
  initialRecord,
}: PerformanceRecordFormProps) {
  const action = mode === "create" ? createPerformanceRecordAction : updatePerformanceRecordAction;
  const [state, formAction] = useActionState(action, initialFormActionState);
  const [employeeId, setEmployeeId] = useState(initialRecord?.employeeId ?? "");
  const [tanggal, setTanggal] = useState(
    initialRecord ? formatDateInput(initialRecord.tanggal) : getDefaultDateValue(),
  );
  const [rows, setRows] = useState<RowState[]>(
    initialRecord?.items.length
      ? initialRecord.items.map((item) =>
          createRowState({
            itemId: item.id,
            productId: item.productId,
            qty: String(item.qty),
          }),
        )
      : [createRowState()],
  );

  useActionStateToast(state);

  useEffect(() => {
    if (state.status === "success" && mode === "create") {
      setEmployeeId("");
      setTanggal(getDefaultDateValue());
      setRows([createRowState()]);
    }
  }, [mode, state.status]);

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          {
            id: product.id,
            namaProduk: product.namaProduk,
            divisi: product.divisi,
            upahSatuan: product.upahSatuan,
          },
        ]),
      ),
    [products],
  );
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const estimatedTotal = rows.reduce((sum, row) => {
    const product = productMap.get(row.productId);
    const qty = Number(row.qty);

    if (!product || !Number.isFinite(qty) || qty <= 0) {
      return sum;
    }

    return sum + qty * product.upahSatuan;
  }, 0);

  function updateRow(clientId: string, nextValue: Partial<RowState>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.clientId === clientId ? { ...row, ...nextValue } : row)),
    );
  }

  function removeRow(clientId: string) {
    setRows((currentRows) => {
      if (currentRows.length === 1) {
        return currentRows;
      }

      return currentRows.filter((row) => row.clientId !== clientId);
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialRecord ? <input name="id" type="hidden" value={initialRecord.id} /> : null}

      <Card className="rounded-[24px] border-border/70 bg-background/70">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
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
              Tanggal Kerja
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Item Produk</h3>
          <p className="text-sm text-muted-foreground">
            Satu karyawan hanya boleh punya satu record aktif per tanggal. Qty dihitung otomatis
            menjadi upah per item.
          </p>
        </div>

        <Button
          onClick={() => setRows((currentRows) => [...currentRows, createRowState()])}
          type="button"
          variant="outline"
        >
          <Plus />
          Tambah Item
        </Button>
      </div>

      <FieldError errors={state.fieldErrors.items} />

      <div className="space-y-3">
        {rows.map((row, index) => {
          const product = productMap.get(row.productId);
          const qty = Number(row.qty);
          const lineTotal =
            product && Number.isFinite(qty) && qty > 0 ? qty * product.upahSatuan : 0;

          return (
            <Card className="rounded-[24px] border-border/70 bg-background/75" key={row.clientId}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">Item {index + 1}</Badge>
                    {product ? <Badge>{product.divisi}</Badge> : null}
                  </div>

                  <Button
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.clientId)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                    Hapus
                  </Button>
                </div>

                <input name="itemId" type="hidden" value={row.itemId ?? ""} />

                <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`productId-${row.clientId}`}>
                      Produk
                    </label>
                    <Select
                      id={`productId-${row.clientId}`}
                      name="productId"
                      onChange={(event) =>
                        updateRow(row.clientId, { productId: event.target.value })
                      }
                      value={row.productId}
                    >
                      <option disabled value="">
                        Pilih produk
                      </option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.namaProduk} • {option.divisi} • {formatCurrency(option.upahSatuan)}
                        </option>
                      ))}
                    </Select>
                    <FieldError errors={state.fieldErrors[`items.${index}.productId`]} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`qty-${row.clientId}`}>
                      Qty
                    </label>
                    <Input
                      id={`qty-${row.clientId}`}
                      min={1}
                      name="qty"
                      onChange={(event) => updateRow(row.clientId, { qty: event.target.value })}
                      placeholder="0"
                      type="number"
                      value={row.qty}
                    />
                    <FieldError errors={state.fieldErrors[`items.${index}.qty`]} />
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Upah satuan</p>
                    <p className="mt-1 font-medium">
                      {product ? formatCurrency(product.upahSatuan) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subtotal item</p>
                    <p className="mt-1 font-medium">
                      {lineTotal > 0 ? formatCurrency(lineTotal) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ringkasan</p>
                    <p className="mt-1 font-medium">
                      {product && qty > 0 ? `${qty} × ${product.namaProduk}` : "Lengkapi produk dan qty"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[24px] border-border/70 bg-background/75">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Preview record
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {selectedEmployee
                  ? `${selectedEmployee.nama} • ${selectedEmployee.divisi}`
                  : "Pilih karyawan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {tanggal ? formatDateOnly(tanggal) : "Pilih tanggal kerja"}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Estimasi total upah</p>
            <p className="text-2xl font-semibold">{formatCurrency(estimatedTotal)}</p>
            <p className="text-sm text-muted-foreground">{rows.length} item di form</p>
          </div>
        </CardContent>
      </Card>

      <ActionStateFeedback state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel={mode === "create" ? "Menyimpan..." : "Memperbarui..."}>
          {mode === "create" ? "Simpan Record" : "Simpan Perubahan"}
        </SubmitButton>

        <Button asChild variant="outline">
          <Link href="/dashboard/admin/kinerja">Kembali ke Daftar</Link>
        </Button>
      </div>
    </form>
  );
}
