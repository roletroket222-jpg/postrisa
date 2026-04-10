import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { EditProductForm } from "@/components/master-data/product-forms";
import { getActiveProductById } from "@/server/master-data/products";

type ProductEditPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { productId } = await params;
  const product = await getActiveProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge>Edit Produk</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">{product.namaProduk}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Terakhir diperbarui pada {formatDate(product.updatedAt)}.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Form Edit Produk</CardTitle>
          <CardDescription>Perubahan akan langsung tersimpan ke master produk aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditProductForm product={product} />
        </CardContent>
      </Card>
    </section>
  );
}
