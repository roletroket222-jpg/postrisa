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
  createProductAction,
  importProductsAction,
  updateProductAction,
} from "@/server/master-data/product-actions";
import type { ProductListItem } from "@/server/master-data/products";

type EditProductFormProps = {
  product: ProductListItem;
};

function ImportHint() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
      Header Excel produk:
      <span className="ml-1 font-medium text-foreground">
        <code>nama_produk</code>, <code>divisi</code>, <code>upah_satuan</code>
      </span>
    </div>
  );
}

export function CreateProductForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createProductAction, initialFormActionState);

  useActionStateToast(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="namaProduk">
            Nama Produk
          </label>
          <Input id="namaProduk" name="namaProduk" placeholder="TABUNG MENTAH 30" />
          <FieldError errors={state.fieldErrors.namaProduk} />
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
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="upahSatuan">
          Upah Satuan
        </label>
        <Input id="upahSatuan" min={1} name="upahSatuan" placeholder="5000" type="number" />
        <FieldError errors={state.fieldErrors.upahSatuan} />
      </div>

      <ActionStateFeedback state={state} />

      <SubmitButton>Simpan Produk</SubmitButton>
    </form>
  );
}

export function ImportProductsForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(importProductsAction, initialFormActionState);

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
        <label className="text-sm font-medium" htmlFor="productImportFile">
          File Excel
        </label>
        <Input accept=".xlsx,.xls" id="productImportFile" name="file" type="file" />
      </div>

      <ActionStateFeedback state={state} />

      <SubmitButton pendingLabel="Mengimpor Produk...">
        <Upload />
        Import Produk
      </SubmitButton>
    </form>
  );
}

export function EditProductForm({ product }: EditProductFormProps) {
  const [state, formAction] = useActionState(updateProductAction, initialFormActionState);

  useActionStateToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input name="id" type="hidden" value={product.id} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="namaProduk">
            Nama Produk
          </label>
          <Input defaultValue={product.namaProduk} id="namaProduk" name="namaProduk" />
          <FieldError errors={state.fieldErrors.namaProduk} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="divisi">
            Divisi
          </label>
          <Select defaultValue={product.divisi} id="divisi" name="divisi">
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors.divisi} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="upahSatuan">
          Upah Satuan
        </label>
        <Input
          defaultValue={String(product.upahSatuan)}
          id="upahSatuan"
          min={1}
          name="upahSatuan"
          type="number"
        />
        <FieldError errors={state.fieldErrors.upahSatuan} />
      </div>

      <ActionStateFeedback state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton>Simpan Perubahan</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/produk">Kembali ke Daftar</Link>
        </Button>
      </div>
    </form>
  );
}
