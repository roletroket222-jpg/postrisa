import Link from "next/link";

import { PackageSearch, PencilLine, RotateCcw, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { CreateProductForm, ImportProductsForm } from "@/components/master-data/product-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getProductMasterData,
} from "@/server/master-data/products";
import { archiveProductAction, restoreProductAction } from "@/server/master-data/product-actions";

export default async function ProductMasterPage() {
  const { activeProducts, archivedProducts } = await getProductMasterData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Master Produk</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Kelola master produk</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Admin dapat menambah, mengubah, menghapus sementara, dan import master produk
          dari Excel. Produk yang sudah dihapus tetap bisa dipulihkan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{activeProducts.length}</CardTitle>
            <CardDescription>Produk aktif</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{archivedProducts.length}</CardTitle>
            <CardDescription>Produk terarsip</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCurrency(activeProducts.reduce((sum, item) => sum + item.upahSatuan, 0))}</CardTitle>
            <CardDescription>Total upah satuan seluruh produk aktif</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Produk</CardTitle>
            <CardDescription>Gunakan form ini untuk menambah satu produk baru.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProductForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Excel</CardTitle>
            <CardDescription>
              Import akan membuat produk baru, memperbarui produk aktif, atau memulihkan
              produk yang pernah dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportProductsForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produk Aktif</CardTitle>
          <CardDescription>Daftar produk yang dapat dipakai pada pencatatan kinerja harian.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activeProducts.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Nama Produk</th>
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Upah Satuan</th>
                  <th className="px-3 py-3 font-medium">Diperbarui</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activeProducts.map((product) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={product.id}>
                    <td className="px-3 py-4 font-medium">{product.namaProduk}</td>
                    <td className="px-3 py-4">{product.divisi}</td>
                    <td className="px-3 py-4">{formatCurrency(product.upahSatuan)}</td>
                    <td className="px-3 py-4 text-muted-foreground">{formatDate(product.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/produk/${product.id}`}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <form action={archiveProductAction}>
                          <input name="id" type="hidden" value={product.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`Hapus sementara produk ${product.namaProduk}?`}
                            pendingLabel="Menghapus..."
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
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
              Belum ada produk aktif.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produk Terarsip</CardTitle>
          <CardDescription>Data soft delete tetap dipertahankan dan bisa dipulihkan.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {archivedProducts.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Nama Produk</th>
                  <th className="px-3 py-3 font-medium">Divisi</th>
                  <th className="px-3 py-3 font-medium">Upah Satuan</th>
                  <th className="px-3 py-3 font-medium">Dihapus</th>
                  <th className="px-3 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {archivedProducts.map((product) => (
                  <tr className="border-b border-border/70 align-top last:border-none" key={product.id}>
                    <td className="px-3 py-4 font-medium">{product.namaProduk}</td>
                    <td className="px-3 py-4">{product.divisi}</td>
                    <td className="px-3 py-4">{formatCurrency(product.upahSatuan)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {product.deletedAt ? formatDate(product.deletedAt) : "-"}
                    </td>
                    <td className="px-3 py-4">
                      <form action={restoreProductAction}>
                        <input name="id" type="hidden" value={product.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Pulihkan produk ${product.namaProduk}?`}
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
              Belum ada produk terarsip.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Import</CardTitle>
          <CardDescription>Pastikan header sesuai agar import berjalan mulus.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-3 rounded-3xl border border-border/80 bg-background/70 p-4">
            <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              File produk memakai kolom <code>nama_produk</code>, <code>divisi</code>, dan{" "}
              <code>upah_satuan</code>. Nilai <code>divisi</code> harus salah satu dari{" "}
              <code>TABUNG</code>, <code>ASESORIS</code>, atau <code>PACKING</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
