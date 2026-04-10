import { revalidatePath } from "next/cache";

import type { Employee, Product } from "@/generated/prisma/client";
import { AuditAction, UserRole } from "@/generated/prisma/enums";
import { assertAdminSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import {
  type FormActionState,
  errorState,
  successState,
} from "@/server/form-state";
import {
  toPerformanceRecordAuditSnapshot,
  toPerformanceRecordItemAuditSnapshot,
  withPerformanceAuditMiddleware,
} from "@/server/performance/audit";

import { z } from "zod";

const recordHeaderSchema = z.object({
  employeeId: z.string().uuid("Karyawan tidak valid."),
  tanggal: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi."),
});

const recordUpdateSchema = recordHeaderSchema.extend({
  id: z.string().uuid("Record tidak valid."),
});

const recordItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  productId: z.string().uuid("Produk wajib dipilih."),
  qty: z.coerce
    .number({
      error: "Qty wajib berupa angka.",
    })
    .int("Qty harus bilangan bulat.")
    .positive("Qty harus lebih dari 0."),
});

type ParsedRecordItem = z.infer<typeof recordItemSchema> & {
  index: number;
};

type ResolvedRecordItem = ParsedRecordItem & {
  product: Pick<Product, "id" | "namaProduk" | "divisi" | "upahSatuan">;
  upah: number;
};

type ActiveEmployeeOption = Pick<Employee, "id" | "nama" | "divisi" | "kategori">;

type RecordWithRelations = Awaited<ReturnType<typeof getActivePerformanceRecordById>>;

class PerformanceValidationError extends Error {
  fieldErrors: FormActionState["fieldErrors"];

  constructor(message: string, fieldErrors: FormActionState["fieldErrors"] = {}) {
    super(message);
    this.name = "PerformanceValidationError";
    this.fieldErrors = fieldErrors;
  }
}

function toRecordDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function revalidatePerformanceRoutes(recordId?: string) {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/kinerja");

  if (recordId) {
    revalidatePath(`/dashboard/admin/kinerja/${recordId}`);
  }
}

function getFormArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => value.toString());
}

function parseRecordItems(formData: FormData): ParsedRecordItem[] {
  const itemIds = getFormArray(formData, "itemId");
  const productIds = getFormArray(formData, "productId");
  const qtys = getFormArray(formData, "qty");
  const rowCount = Math.max(itemIds.length, productIds.length, qtys.length);

  if (rowCount === 0) {
    throw new PerformanceValidationError("Minimal satu item produk wajib diisi.", {
      items: ["Minimal satu item produk wajib diisi."],
    });
  }

  if (itemIds.length !== rowCount || productIds.length !== rowCount || qtys.length !== rowCount) {
    throw new PerformanceValidationError("Susunan item tidak valid. Muat ulang halaman lalu coba lagi.");
  }

  const items: ParsedRecordItem[] = [];
  const fieldErrors: FormActionState["fieldErrors"] = {};

  for (let index = 0; index < rowCount; index += 1) {
    const parsed = recordItemSchema.safeParse({
      itemId: itemIds[index]?.trim() ? itemIds[index] : undefined,
      productId: productIds[index],
      qty: qtys[index],
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      if (errors.productId?.length) {
        fieldErrors[`items.${index}.productId`] = errors.productId;
      }

      if (errors.qty?.length) {
        fieldErrors[`items.${index}.qty`] = errors.qty;
      }

      continue;
    }

    items.push({
      ...parsed.data,
      index,
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new PerformanceValidationError("Periksa kembali item kinerja.", fieldErrors);
  }

  const duplicateProductIds = new Set<string>();
  const productIdCounter = new Map<string, number>();

  for (const item of items) {
    productIdCounter.set(item.productId, (productIdCounter.get(item.productId) ?? 0) + 1);
  }

  for (const [productId, count] of productIdCounter.entries()) {
    if (count > 1) {
      duplicateProductIds.add(productId);
    }
  }

  if (duplicateProductIds.size > 0) {
    const duplicateErrors: FormActionState["fieldErrors"] = {};

    for (const item of items) {
      if (duplicateProductIds.has(item.productId)) {
        duplicateErrors[`items.${item.index}.productId`] = [
          "Produk yang sama tidak boleh diinput dua kali dalam satu record.",
        ];
      }
    }

    throw new PerformanceValidationError("Gabungkan qty untuk produk yang sama.", duplicateErrors);
  }

  return items;
}

async function getActiveEmployeeOrThrow(tx: typeof prisma, employeeId: string) {
  const employee = await tx.employee.findFirst({
    where: {
      id: employeeId,
      deletedAt: null,
      user: {
        deletedAt: null,
        role: UserRole.KARYAWAN,
      },
    },
    select: {
      id: true,
      nama: true,
      divisi: true,
      kategori: true,
    },
  });

  if (!employee) {
    throw new PerformanceValidationError("Karyawan tidak ditemukan atau sudah diarsipkan.", {
      employeeId: ["Karyawan tidak ditemukan atau sudah diarsipkan."],
    });
  }

  return employee;
}

async function resolveSubmittedItems(tx: typeof prisma, items: ParsedRecordItem[]) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await tx.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      namaProduk: true,
      divisi: true,
      upahSatuan: true,
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  if (productMap.size !== productIds.length) {
    const fieldErrors: FormActionState["fieldErrors"] = {};

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        fieldErrors[`items.${item.index}.productId`] = ["Produk tidak ditemukan atau sudah diarsipkan."];
      }
    }

    throw new PerformanceValidationError("Ada produk yang tidak valid.", fieldErrors);
  }

  return items.map((item) => {
    const product = productMap.get(item.productId)!;

    return {
      ...item,
      product,
      upah: item.qty * product.upahSatuan,
    } satisfies ResolvedRecordItem;
  });
}

async function assertUniqueActiveRecord(
  tx: typeof prisma,
  employeeId: string,
  tanggal: Date,
  excludeId?: string,
) {
  const where: {
    employeeId: string;
    tanggal: Date;
    deletedAt: null;
    id?: {
      not: string;
    };
  } = {
    employeeId,
    tanggal,
    deletedAt: null,
  };

  if (excludeId) {
    where.id = {
      not: excludeId,
    };
  }

  const existing = await tx.performanceRecord.findFirst({
    where,
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new PerformanceValidationError(
      "Karyawan ini sudah memiliki record aktif pada tanggal tersebut.",
      {
        employeeId: ["Karyawan ini sudah memiliki record aktif pada tanggal tersebut."],
        tanggal: ["Pilih tanggal lain atau edit record yang sudah ada."],
      },
    );
  }
}

function buildRecordAuditSource(params: {
  record: {
    id: string;
    employeeId: string;
    tanggal: Date;
    totalUpah: number;
    deletedAt?: Date | null;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
  };
  employee: ActiveEmployeeOption;
  createdBy: {
    id: string;
    name?: string | null | undefined;
  };
  itemCount: number;
}) {
  return {
    id: params.record.id,
    employeeId: params.record.employeeId,
    tanggal: params.record.tanggal,
    totalUpah: params.record.totalUpah,
    deletedAt: params.record.deletedAt ?? null,
    createdAt: params.record.createdAt,
    updatedAt: params.record.updatedAt,
    employee: {
      nama: params.employee.nama,
      divisi: params.employee.divisi,
      kategori: params.employee.kategori,
    },
    createdBy: params.createdBy,
    itemCount: params.itemCount,
  };
}

function buildItemAuditSource(params: {
  item: {
    id: string;
    recordId: string;
    productId: string;
    qty: number;
    upah: number;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
  };
  product: Pick<Product, "namaProduk" | "divisi" | "upahSatuan">;
}) {
  return {
    id: params.item.id,
    recordId: params.item.recordId,
    productId: params.item.productId,
    qty: params.item.qty,
    upah: params.item.upah,
    createdAt: params.item.createdAt,
    updatedAt: params.item.updatedAt,
    product: params.product,
  };
}

function handlePerformanceActionError(
  error: unknown,
  fallbackMessage: string,
): FormActionState {
  if (error instanceof PerformanceValidationError) {
    return errorState(error.message, error.fieldErrors);
  }

  return errorState(fallbackMessage);
}

export async function getPerformanceRecordMasterData() {
  await assertAdminSession();

  const [employees, products, activeRecords, archivedRecords] = await Promise.all([
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
          role: UserRole.KARYAWAN,
        },
      },
      select: {
        id: true,
        nama: true,
        divisi: true,
        kategori: true,
      },
      orderBy: [{ divisi: "asc" }, { nama: "asc" }],
    }),
    prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        namaProduk: true,
        divisi: true,
        upahSatuan: true,
      },
      orderBy: [{ divisi: "asc" }, { namaProduk: "asc" }],
    }),
    prisma.performanceRecord.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            nama: true,
            divisi: true,
            kategori: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                namaProduk: true,
                divisi: true,
                upahSatuan: true,
              },
            },
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.performanceRecord.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            nama: true,
            divisi: true,
            kategori: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                namaProduk: true,
                divisi: true,
                upahSatuan: true,
              },
            },
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
      orderBy: [{ deletedAt: "desc" }, { tanggal: "desc" }],
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const recordsToday = activeRecords.filter(
    (record) => record.tanggal.toISOString().slice(0, 10) === today,
  );
  const totalToday = recordsToday.reduce((sum, record) => sum + record.totalUpah, 0);

  return {
    employees,
    products,
    activeRecords,
    archivedRecords,
    summary: {
      totalRecords: activeRecords.length,
      recordsToday: recordsToday.length,
      totalToday,
    },
  };
}

export async function getPerformanceRecordFormOptions() {
  await assertAdminSession();

  const [employees, products] = await Promise.all([
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
          role: UserRole.KARYAWAN,
        },
      },
      select: {
        id: true,
        nama: true,
        divisi: true,
        kategori: true,
      },
      orderBy: [{ divisi: "asc" }, { nama: "asc" }],
    }),
    prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        namaProduk: true,
        divisi: true,
        upahSatuan: true,
      },
      orderBy: [{ divisi: "asc" }, { namaProduk: "asc" }],
    }),
  ]);

  return {
    employees,
    products,
  };
}

export async function getActivePerformanceRecordById(id: string) {
  await assertAdminSession();

  return prisma.performanceRecord.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      employee: {
        select: {
          id: true,
          nama: true,
          divisi: true,
          kategori: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              namaProduk: true,
              divisi: true,
              upahSatuan: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });
}

export async function createPerformanceRecordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const session = await assertAdminSession();

  const headerParsed = recordHeaderSchema.safeParse({
    employeeId: formData.get("employeeId"),
    tanggal: formData.get("tanggal"),
  });

  if (!headerParsed.success) {
    return errorState(
      "Periksa kembali data header kinerja.",
      headerParsed.error.flatten().fieldErrors,
    );
  }

  let parsedItems: ParsedRecordItem[];

  try {
    parsedItems = parseRecordItems(formData);
  } catch (error) {
    return handlePerformanceActionError(error, "Gagal memproses item kinerja.");
  }

  try {
    await withPerformanceAuditMiddleware({
      actorUserId: session.user.id,
      execute: async ({ tx, logItem, logRecord }) => {
        const tanggal = toRecordDate(headerParsed.data.tanggal);
        const employee = await getActiveEmployeeOrThrow(tx, headerParsed.data.employeeId);
        await assertUniqueActiveRecord(tx, employee.id, tanggal);

        const resolvedItems = await resolveSubmittedItems(tx, parsedItems);
        const totalUpah = resolvedItems.reduce((sum, item) => sum + item.upah, 0);

        const record = await tx.performanceRecord.create({
          data: {
            employeeId: employee.id,
            tanggal,
            totalUpah,
            createdById: session.user.id,
          },
        });

        const createdItems = [];

        for (const item of resolvedItems) {
          const createdItem = await tx.performanceRecordItem.create({
            data: {
              recordId: record.id,
              productId: item.productId,
              qty: item.qty,
              upah: item.upah,
            },
          });

          createdItems.push(createdItem);

          logItem({
            recordId: record.id,
            targetId: createdItem.id,
            action: AuditAction.CREATE,
            newValues: toPerformanceRecordItemAuditSnapshot(
              buildItemAuditSource({
                item: createdItem,
                product: item.product,
              }),
            ),
          });
        }

        logRecord({
          recordId: record.id,
          targetId: record.id,
          action: AuditAction.CREATE,
          newValues: toPerformanceRecordAuditSnapshot(
            buildRecordAuditSource({
              record,
              employee,
              createdBy: {
                id: session.user.id,
                name: session.user.name,
              },
              itemCount: createdItems.length,
            }),
          ),
        });

        revalidatePerformanceRoutes(record.id);
      },
    });

    return successState("Record kinerja harian berhasil ditambahkan.");
  } catch (error) {
    return handlePerformanceActionError(error, "Gagal menyimpan record kinerja.");
  }
}

export async function updatePerformanceRecordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const session = await assertAdminSession();

  const headerParsed = recordUpdateSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    tanggal: formData.get("tanggal"),
  });

  if (!headerParsed.success) {
    return errorState(
      "Periksa kembali data header kinerja.",
      headerParsed.error.flatten().fieldErrors,
    );
  }

  let parsedItems: ParsedRecordItem[];

  try {
    parsedItems = parseRecordItems(formData);
  } catch (error) {
    return handlePerformanceActionError(error, "Gagal memproses item kinerja.");
  }

  try {
    await withPerformanceAuditMiddleware({
      actorUserId: session.user.id,
      execute: async ({ tx, logItem, logRecord }) => {
        const currentRecord = await tx.performanceRecord.findFirst({
          where: {
            id: headerParsed.data.id,
            deletedAt: null,
          },
          include: {
            employee: {
              select: {
                id: true,
                nama: true,
                divisi: true,
                kategori: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    namaProduk: true,
                    divisi: true,
                    upahSatuan: true,
                  },
                },
              },
              orderBy: [{ createdAt: "asc" }],
            },
          },
        });

        if (!currentRecord) {
          throw new PerformanceValidationError("Record kinerja tidak ditemukan.");
        }

        const tanggal = toRecordDate(headerParsed.data.tanggal);
        const employee = await getActiveEmployeeOrThrow(tx, headerParsed.data.employeeId);
        await assertUniqueActiveRecord(tx, employee.id, tanggal, currentRecord.id);

        const resolvedItems = await resolveSubmittedItems(tx, parsedItems);
        const totalUpah = resolvedItems.reduce((sum, item) => sum + item.upah, 0);
        const currentItemsById = new Map(currentRecord.items.map((item) => [item.id, item]));
        const submittedExistingIds = new Set<string>();

        for (const item of resolvedItems) {
          if (!item.itemId) {
            continue;
          }

          if (!currentItemsById.has(item.itemId)) {
            throw new PerformanceValidationError(
              "Ada item yang tidak cocok dengan record ini. Muat ulang halaman lalu coba lagi.",
            );
          }

          if (submittedExistingIds.has(item.itemId)) {
            throw new PerformanceValidationError(
              "Ada item yang terduplikasi pada form. Muat ulang halaman lalu coba lagi.",
            );
          }

          submittedExistingIds.add(item.itemId);
        }

        for (const existingItem of currentRecord.items) {
          if (!submittedExistingIds.has(existingItem.id)) {
            logItem({
              recordId: currentRecord.id,
              targetId: existingItem.id,
              action: AuditAction.SOFT_DELETE,
              oldValues: toPerformanceRecordItemAuditSnapshot(
                buildItemAuditSource({
                  item: existingItem,
                  product: existingItem.product,
                }),
              ),
            });

            await tx.performanceRecordItem.delete({
              where: {
                id: existingItem.id,
              },
            });
          }
        }

        for (const item of resolvedItems) {
          if (!item.itemId) {
            const createdItem = await tx.performanceRecordItem.create({
              data: {
                recordId: currentRecord.id,
                productId: item.productId,
                qty: item.qty,
                upah: item.upah,
              },
            });

            logItem({
              recordId: currentRecord.id,
              targetId: createdItem.id,
              action: AuditAction.CREATE,
              newValues: toPerformanceRecordItemAuditSnapshot(
                buildItemAuditSource({
                  item: createdItem,
                  product: item.product,
                }),
              ),
            });

            continue;
          }

          const existingItem = currentItemsById.get(item.itemId)!;
          const hasChanged =
            existingItem.productId !== item.productId ||
            existingItem.qty !== item.qty ||
            existingItem.upah !== item.upah;

          if (!hasChanged) {
            continue;
          }

          const updatedItem = await tx.performanceRecordItem.update({
            where: {
              id: existingItem.id,
            },
            data: {
              productId: item.productId,
              qty: item.qty,
              upah: item.upah,
            },
          });

          logItem({
            recordId: currentRecord.id,
            targetId: updatedItem.id,
            action: AuditAction.UPDATE,
            oldValues: toPerformanceRecordItemAuditSnapshot(
              buildItemAuditSource({
                item: existingItem,
                product: existingItem.product,
              }),
            ),
            newValues: toPerformanceRecordItemAuditSnapshot(
              buildItemAuditSource({
                item: updatedItem,
                product: item.product,
              }),
            ),
          });
        }

        const updatedRecord = await tx.performanceRecord.update({
          where: {
            id: currentRecord.id,
          },
          data: {
            employeeId: employee.id,
            tanggal,
            totalUpah,
          },
        });

        const oldRecordSnapshot = toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: currentRecord,
            employee: currentRecord.employee,
            createdBy: currentRecord.createdBy,
            itemCount: currentRecord.items.length,
          }),
        );
        const newRecordSnapshot = toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: updatedRecord,
            employee,
            createdBy: currentRecord.createdBy,
            itemCount: resolvedItems.length,
          }),
        );

        if (JSON.stringify(oldRecordSnapshot) !== JSON.stringify(newRecordSnapshot)) {
          logRecord({
            recordId: currentRecord.id,
            targetId: currentRecord.id,
            action: AuditAction.UPDATE,
            oldValues: oldRecordSnapshot,
            newValues: newRecordSnapshot,
          });
        }

        revalidatePerformanceRoutes(currentRecord.id);
      },
    });

    return successState("Record kinerja harian berhasil diperbarui.");
  } catch (error) {
    return handlePerformanceActionError(error, "Gagal memperbarui record kinerja.");
  }
}

export async function archivePerformanceRecordAction(formData: FormData) {
  const session = await assertAdminSession();
  const parsedId = z.string().uuid().safeParse(formData.get("id"));

  if (!parsedId.success) {
    throw new Error("ID record tidak valid.");
  }

  await withPerformanceAuditMiddleware({
    actorUserId: session.user.id,
    execute: async ({ tx, logRecord }) => {
      const currentRecord = await tx.performanceRecord.findFirst({
        where: {
          id: parsedId.data,
          deletedAt: null,
        },
        include: {
          employee: {
            select: {
              id: true,
              nama: true,
              divisi: true,
              kategori: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!currentRecord) {
        throw new Error("Record kinerja tidak ditemukan.");
      }

      const archivedRecord = await tx.performanceRecord.update({
        where: {
          id: currentRecord.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      logRecord({
        recordId: currentRecord.id,
        targetId: currentRecord.id,
        action: AuditAction.SOFT_DELETE,
        oldValues: toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: currentRecord,
            employee: currentRecord.employee,
            createdBy: currentRecord.createdBy,
            itemCount: currentRecord.items.length,
          }),
        ),
        newValues: toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: archivedRecord,
            employee: currentRecord.employee,
            createdBy: currentRecord.createdBy,
            itemCount: currentRecord.items.length,
          }),
        ),
      });

      revalidatePerformanceRoutes(currentRecord.id);
    },
  });
}

export async function restorePerformanceRecordAction(formData: FormData) {
  const session = await assertAdminSession();
  const parsedId = z.string().uuid().safeParse(formData.get("id"));

  if (!parsedId.success) {
    throw new Error("ID record tidak valid.");
  }

  await withPerformanceAuditMiddleware({
    actorUserId: session.user.id,
    execute: async ({ tx, logRecord }) => {
      const currentRecord = await tx.performanceRecord.findFirst({
        where: {
          id: parsedId.data,
          deletedAt: {
            not: null,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              nama: true,
              divisi: true,
              kategori: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!currentRecord) {
        throw new Error("Record arsip tidak ditemukan.");
      }

      await assertUniqueActiveRecord(tx, currentRecord.employeeId, currentRecord.tanggal, currentRecord.id);

      const restoredRecord = await tx.performanceRecord.update({
        where: {
          id: currentRecord.id,
        },
        data: {
          deletedAt: null,
        },
      });

      logRecord({
        recordId: currentRecord.id,
        targetId: currentRecord.id,
        action: AuditAction.RESTORE,
        oldValues: toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: currentRecord,
            employee: currentRecord.employee,
            createdBy: currentRecord.createdBy,
            itemCount: currentRecord.items.length,
          }),
        ),
        newValues: toPerformanceRecordAuditSnapshot(
          buildRecordAuditSource({
            record: restoredRecord,
            employee: currentRecord.employee,
            createdBy: currentRecord.createdBy,
            itemCount: currentRecord.items.length,
          }),
        ),
      });

      revalidatePerformanceRoutes(currentRecord.id);
    },
  });
}

export type PerformanceRecordListItem = Awaited<
  ReturnType<typeof getPerformanceRecordMasterData>
>["activeRecords"][number];

export type PerformanceRecordFormOptions = Awaited<
  ReturnType<typeof getPerformanceRecordFormOptions>
>;

export type PerformanceRecordEditItem = NonNullable<RecordWithRelations>["items"][number];
