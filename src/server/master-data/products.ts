import { revalidatePath } from "next/cache";

import { DIVISIONS } from "@/lib/constants";
import { assertAdminSession } from "@/server/auth/session";
import { parseWorkbookRows, normalizeSpreadsheetRow, toSpreadsheetString } from "@/server/master-data/excel";
import {
  type FormActionState,
  errorState,
  successState,
} from "@/server/form-state";
import { prisma } from "@/server/db/client";

import { z } from "zod";

const productFormSchema = z.object({
  namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
  divisi: z.enum(DIVISIONS, {
    error: "Divisi tidak valid",
  }),
  upahSatuan: z.coerce
    .number({
      error: "Upah satuan wajib berupa angka",
    })
    .int("Upah satuan harus bilangan bulat")
    .positive("Upah satuan harus lebih dari 0"),
});

const productUpdateSchema = productFormSchema.extend({
  id: z.string().uuid(),
});

const productImportRowSchema = z.object({
  namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
  divisi: z.enum(DIVISIONS, {
    error: "Divisi tidak valid",
  }),
  upahSatuan: z.coerce
    .number({
      error: "Upah satuan wajib berupa angka",
    })
    .int("Upah satuan harus bilangan bulat")
    .positive("Upah satuan harus lebih dari 0"),
});

export type ProductListItem = Awaited<ReturnType<typeof getProductMasterData>>["activeProducts"][number];

function normalizeProductName(value: string) {
  return value.trim();
}

function revalidateProductRoutes(productId?: string) {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/produk");

  if (productId) {
    revalidatePath(`/dashboard/admin/produk/${productId}`);
  }
}

export async function getProductMasterData() {
  await assertAdminSession();

  const [activeProducts, archivedProducts] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ divisi: "asc" }, { namaProduk: "asc" }],
    }),
    prisma.product.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: [{ deletedAt: "desc" }, { namaProduk: "asc" }],
    }),
  ]);

  return {
    activeProducts,
    archivedProducts,
  };
}

export async function getActiveProductById(id: string) {
  await assertAdminSession();

  return prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
}

export async function createProductAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const parsed = productFormSchema.safeParse({
    namaProduk: formData.get("namaProduk"),
    divisi: formData.get("divisi"),
    upahSatuan: formData.get("upahSatuan"),
  });

  if (!parsed.success) {
    return errorState("Periksa kembali data produk.", parsed.error.flatten().fieldErrors);
  }

  const { divisi, upahSatuan } = parsed.data;
  const namaProduk = normalizeProductName(parsed.data.namaProduk);

  const existingProduct = await prisma.product.findFirst({
    where: {
      namaProduk,
    },
  });

  if (existingProduct && !existingProduct.deletedAt) {
    return errorState("Nama produk sudah digunakan.", {
      namaProduk: ["Nama produk sudah digunakan."],
    });
  }

  if (existingProduct?.deletedAt) {
    await prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        namaProduk,
        divisi,
        upahSatuan,
        deletedAt: null,
      },
    });

    revalidateProductRoutes(existingProduct.id);
    return successState("Produk yang terhapus berhasil dipulihkan dan diperbarui.");
  }

  const product = await prisma.product.create({
    data: {
      namaProduk,
      divisi,
      upahSatuan,
    },
  });

  revalidateProductRoutes(product.id);
  return successState("Produk berhasil ditambahkan.");
}

export async function updateProductAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const parsed = productUpdateSchema.safeParse({
    id: formData.get("id"),
    namaProduk: formData.get("namaProduk"),
    divisi: formData.get("divisi"),
    upahSatuan: formData.get("upahSatuan"),
  });

  if (!parsed.success) {
    return errorState("Periksa kembali data produk.", parsed.error.flatten().fieldErrors);
  }

  const { id, divisi, upahSatuan } = parsed.data;
  const namaProduk = normalizeProductName(parsed.data.namaProduk);

  const currentProduct = await prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!currentProduct) {
    return errorState("Produk tidak ditemukan.");
  }

  const nameConflict = await prisma.product.findFirst({
    where: {
      namaProduk,
      id: {
        not: id,
      },
    },
  });

  if (nameConflict) {
    const message = nameConflict.deletedAt
      ? "Nama produk sudah dipakai oleh data terhapus. Gunakan nama lain atau pulihkan data lama."
      : "Nama produk sudah digunakan.";

    return errorState(message, {
      namaProduk: [message],
    });
  }

  await prisma.product.update({
    where: {
      id,
    },
    data: {
      namaProduk,
      divisi,
      upahSatuan,
    },
  });

  revalidateProductRoutes(id);
  return successState("Produk berhasil diperbarui.");
}

export async function archiveProductAction(formData: FormData) {
  await assertAdminSession();

  const id = z.string().uuid().parse(formData.get("id"));

  await prisma.product.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  revalidateProductRoutes(id);
}

export async function restoreProductAction(formData: FormData) {
  await assertAdminSession();

  const id = z.string().uuid().parse(formData.get("id"));

  await prisma.product.update({
    where: {
      id,
    },
    data: {
      deletedAt: null,
    },
  });

  revalidateProductRoutes(id);
}

export async function importProductsAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    return errorState("File Excel wajib dipilih.");
  }

  let rows: Record<string, unknown>[];

  try {
    rows = await parseWorkbookRows(uploadedFile);
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "File Excel gagal dibaca.");
  }

  if (!rows.length) {
    return errorState("File Excel tidak memiliki data.");
  }

  const parsedRows = rows.map((row) => {
    const normalizedRow = normalizeSpreadsheetRow(row);

    return productImportRowSchema.safeParse({
      namaProduk: toSpreadsheetString(normalizedRow.nama_produk),
      divisi: toSpreadsheetString(normalizedRow.divisi).toUpperCase(),
      upahSatuan: toSpreadsheetString(normalizedRow.upah_satuan),
    });
  });

  const importErrors = parsedRows
    .map((result, index) => {
      if (result.success) {
        return null;
      }

      const issue = result.error.issues[0];
      return `Baris ${index + 2}: ${issue?.message ?? "Data tidak valid"}`;
    })
    .filter(Boolean);

  if (importErrors.length) {
    return errorState(importErrors.slice(0, 5).join(" "));
  }

  const validRows = parsedRows
    .filter((result): result is Extract<(typeof parsedRows)[number], { success: true }> => result.success)
    .map((result) => ({
      namaProduk: normalizeProductName(result.data.namaProduk),
      divisi: result.data.divisi,
      upahSatuan: result.data.upahSatuan,
    }));

  let createdCount = 0;
  let updatedCount = 0;
  let restoredCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const existingProduct = await tx.product.findFirst({
        where: {
          namaProduk: row.namaProduk,
        },
      });

      if (!existingProduct) {
        await tx.product.create({
          data: row,
        });
        createdCount += 1;
        continue;
      }

      if (existingProduct.deletedAt) {
        await tx.product.update({
          where: {
            id: existingProduct.id,
          },
          data: {
            ...row,
            deletedAt: null,
          },
        });
        restoredCount += 1;
        continue;
      }

      await tx.product.update({
        where: {
          id: existingProduct.id,
        },
        data: row,
      });
      updatedCount += 1;
    }
  }, {
    maxWait: 15000,
    timeout: 60000,
  });

  revalidateProductRoutes();

  return successState(
    `Import produk selesai. ${createdCount} dibuat, ${updatedCount} diperbarui, ${restoredCount} dipulihkan.`,
  );
}
