import { revalidatePath } from "next/cache";

import type { Employee } from "@/generated/prisma/client";
import { assertAdminSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import {
  type FormActionState,
  errorState,
  successState,
} from "@/server/form-state";

import { z } from "zod";

const kasbonHeaderSchema = z.object({
  employeeId: z.string().uuid("Karyawan tidak valid."),
  tanggal: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi."),
  nominal: z.coerce
    .number({
      error: "Nominal wajib berupa angka.",
    })
    .int("Nominal harus bilangan bulat.")
    .positive("Nominal harus lebih dari 0."),
  keterangan: z.string().trim().max(255, "Keterangan maksimal 255 karakter").optional().nullable(),
});

const kasbonUpdateSchema = kasbonHeaderSchema.extend({
  id: z.string().uuid("Record tidak valid."),
});

type KasbonRecordWithRelations = Awaited<ReturnType<typeof getActiveKasbonRecordById>>;

class KasbonValidationError extends Error {
  fieldErrors: FormActionState["fieldErrors"];

  constructor(message: string, fieldErrors: FormActionState["fieldErrors"] = {}) {
    super(message);
    this.name = "KasbonValidationError";
    this.fieldErrors = fieldErrors;
  }
}

function toRecordDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function revalidateKasbonRoutes(recordId?: string) {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/kasbon");

  if (recordId) {
    revalidatePath(`/dashboard/admin/kasbon/${recordId}`);
  }
}

function handleKasbonActionError(error: unknown, fallbackMessage: string): FormActionState {
  if (error instanceof KasbonValidationError) {
    return errorState(error.message, error.fieldErrors);
  }

  if (error instanceof Error) {
    return errorState(error.message);
  }

  return errorState(fallbackMessage);
}

export async function getKasbonRecordMasterData() {
  await assertAdminSession();

  const [activeRecords, archivedRecords, employees, summaryStats] = await Promise.all([
    prisma.kasbonRecord.findMany({
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
            name: true,
          },
        },
      },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.kasbonRecord.findMany({
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
            name: true,
          },
        },
      },
      orderBy: [{ deletedAt: "desc" }],
    }),
    prisma.employee.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ nama: "asc" }],
      select: {
        id: true,
        nama: true,
        divisi: true,
        kategori: true,
      },
    }),
    prisma.kasbonRecord.aggregate({
      where: {
        deletedAt: null,
      },
      _sum: {
        nominal: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const today = toRecordDate(new Date().toISOString().slice(0, 10));

  const recordsToday = await prisma.kasbonRecord.aggregate({
    where: {
      deletedAt: null,
      tanggal: today,
    },
    _sum: {
      nominal: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    activeRecords,
    archivedRecords,
    employees,
    summary: {
      totalRecords: summaryStats._count._all,
      totalNominal: summaryStats._sum.nominal ?? 0,
      recordsToday: recordsToday._count._all,
      totalToday: recordsToday._sum.nominal ?? 0,
    },
  };
}

export async function getKasbonRecordFormOptions() {
  await assertAdminSession();

  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: [{ nama: "asc" }],
    select: {
      id: true,
      nama: true,
      divisi: true,
      kategori: true,
    },
  });

  return {
    employees,
  };
}

export async function getActiveKasbonRecordById(id: string) {
  await assertAdminSession();

  return prisma.kasbonRecord.findFirst({
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
          deletedAt: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

function assertEmployeeIsActive(employee: NonNullable<KasbonRecordWithRelations>["employee"] | null | undefined) {
  if (!employee) {
    throw new KasbonValidationError("Karyawan tidak ditemukan.");
  }

  if (employee.deletedAt !== null) {
    throw new KasbonValidationError("Karyawan tidak valid karena sudah dihapus dari data master.");
  }
}

async function assertUniqueActiveKasbonRecord(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  employeeId: string,
  tanggal: Date,
  excludeId?: string,
) {
  const existingRecord = await tx.kasbonRecord.findFirst({
    where: {
      employeeId,
      tanggal,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (existingRecord) {
    const message = "Karyawan ini sudah memiliki rekor kasbon aktif pada tanggal yang dipilih.";
    throw new KasbonValidationError(message, {
      tanggal: [message],
    });
  }
}

export async function createKasbonRecordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const session = await assertAdminSession();

  const parsedHeader = kasbonHeaderSchema.safeParse({
    employeeId: formData.get("employeeId"),
    tanggal: formData.get("tanggal"),
    nominal: formData.get("nominal"),
    keterangan: formData.get("keterangan"),
  });

  if (!parsedHeader.success) {
    return errorState("Periksa kembali form kasbon Anda.", parsedHeader.error.flatten().fieldErrors);
  }

  const { employeeId, tanggal: rawTanggal, nominal, keterangan } = parsedHeader.data;
  const tanggal = toRecordDate(rawTanggal);

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    assertEmployeeIsActive(employee as any);

    await prisma.$transaction(async (tx) => {
      await assertUniqueActiveKasbonRecord(tx, employeeId, tanggal);

      const record = await tx.kasbonRecord.create({
        data: {
          employeeId,
          tanggal,
          nominal,
          keterangan: keterangan || null,
          createdById: session.user.id,
        },
      });

      revalidateKasbonRoutes(record.id);
    });

    return successState("Kasbon berhasil ditambahkan.");
  } catch (error) {
    return handleKasbonActionError(error, "Gagal membuat record kasbon.");
  }
}

export async function updateKasbonRecordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const parsedHeader = kasbonUpdateSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    tanggal: formData.get("tanggal"),
    nominal: formData.get("nominal"),
    keterangan: formData.get("keterangan"),
  });

  if (!parsedHeader.success) {
    return errorState("Periksa kembali form kasbon Anda.", parsedHeader.error.flatten().fieldErrors);
  }

  const { id, employeeId, tanggal: rawTanggal, nominal, keterangan } = parsedHeader.data;
  const tanggal = toRecordDate(rawTanggal);

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    assertEmployeeIsActive(employee as any);

    await prisma.$transaction(async (tx) => {
      const currentRecord = await tx.kasbonRecord.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!currentRecord) {
        throw new KasbonValidationError("Record kasbon tidak ditemukan.");
      }

      await assertUniqueActiveKasbonRecord(tx, employeeId, tanggal, currentRecord.id);

      await tx.kasbonRecord.update({
        where: {
          id: currentRecord.id,
        },
        data: {
          employeeId,
          tanggal,
          nominal,
          keterangan: keterangan || null,
        },
      });

      revalidateKasbonRoutes(currentRecord.id);
    });

    return successState("Kasbon berhasil diperbarui.");
  } catch (error) {
    return handleKasbonActionError(error, "Gagal memperbarui kasbon.");
  }
}

export async function archiveKasbonRecordAction(formData: FormData) {
  await assertAdminSession();
  
  const parsedId = z.string().uuid().safeParse(formData.get("id"));

  if (!parsedId.success) {
    throw new Error("ID record tidak valid.");
  }

  await prisma.$transaction(async (tx) => {
    const currentRecord = await tx.kasbonRecord.findFirst({
      where: {
        id: parsedId.data,
        deletedAt: null,
      },
    });

    if (!currentRecord) {
      throw new Error("Kasbon tidak ditemukan.");
    }

    await tx.kasbonRecord.update({
      where: {
        id: currentRecord.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidateKasbonRoutes(currentRecord.id);
  });
}

export async function restoreKasbonRecordAction(formData: FormData) {
  await assertAdminSession();

  const parsedId = z.string().uuid().safeParse(formData.get("id"));

  if (!parsedId.success) {
    throw new Error("ID record tidak valid.");
  }

  await prisma.$transaction(async (tx) => {
    const currentRecord = await tx.kasbonRecord.findFirst({
      where: {
        id: parsedId.data,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!currentRecord) {
      throw new Error("Kasbon arsip tidak ditemukan.");
    }

    await assertUniqueActiveKasbonRecord(tx, currentRecord.employeeId, currentRecord.tanggal, currentRecord.id);

    await tx.kasbonRecord.update({
      where: {
        id: currentRecord.id,
      },
      data: {
        deletedAt: null,
      },
    });

    revalidateKasbonRoutes(currentRecord.id);
  });
}

export type KasbonRecordListItem = Awaited<
  ReturnType<typeof getKasbonRecordMasterData>
>["activeRecords"][number];

export type KasbonRecordFormOptions = Awaited<
  ReturnType<typeof getKasbonRecordFormOptions>
>;
