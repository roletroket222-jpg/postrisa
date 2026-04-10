import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma/enums";
import { DIVISIONS } from "@/lib/constants";
import { hashPassword } from "@/server/auth/password";
import { assertAdminSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { parseWorkbookRows, normalizeSpreadsheetRow, toSpreadsheetString } from "@/server/master-data/excel";
import {
  type FormActionState,
  errorState,
  successState,
} from "@/server/form-state";

import { z } from "zod";

const employeeBaseSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.string().trim().email("Email tidak valid").transform((value) => value.toLowerCase()),
  divisi: z.enum(DIVISIONS, {
    error: "Divisi tidak valid",
  }),
  kategori: z.string().trim().min(1, "Kategori wajib diisi"),
});

const employeeCreateSchema = employeeBaseSchema.extend({
  password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
});

const employeeUpdateSchema = employeeBaseSchema.extend({
  id: z.string().uuid(),
  password: z
    .string()
    .max(72, "Password maksimal 72 karakter")
    .refine((value) => value.length === 0 || value.length >= 8, "Password minimal 8 karakter"),
});

const employeeImportRowSchema = employeeCreateSchema;

type UpsertEmployeePayload = z.infer<typeof employeeCreateSchema>;

export type EmployeeListItem = Awaited<
  ReturnType<typeof getEmployeeMasterData>
>["activeEmployees"][number];

function revalidateEmployeeRoutes(employeeId?: string) {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/karyawan");

  if (employeeId) {
    revalidatePath(`/dashboard/admin/karyawan/${employeeId}`);
  }
}

async function createUserAndEmployee(payload: UpsertEmployeePayload) {
  const password = await hashPassword(payload.password);

  return prisma.user.create({
    data: {
      name: payload.nama,
      email: payload.email,
      password,
      role: UserRole.KARYAWAN,
      employee: {
        create: {
          nama: payload.nama,
          divisi: payload.divisi,
          kategori: payload.kategori,
        },
      },
    },
    include: {
      employee: true,
    },
  });
}

async function restoreOrAttachEmployee(payload: UpsertEmployeePayload) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    include: {
      employee: true,
    },
  });

  if (!existingUser) {
    const createdUser = await createUserAndEmployee(payload);

    return {
      status: "created" as const,
      employeeId: createdUser.employee?.id ?? null,
    };
  }

  if (existingUser.role === UserRole.ADMIN) {
    throw new Error("Email tersebut sudah dipakai akun admin.");
  }

  const password = await hashPassword(payload.password);
  const isActiveEmployee = !existingUser.deletedAt && !existingUser.employee?.deletedAt;

  if (isActiveEmployee) {
    throw new Error("Email karyawan sudah digunakan.");
  }

  if (existingUser.employee) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          name: payload.nama,
          email: payload.email,
          password,
          role: UserRole.KARYAWAN,
          deletedAt: null,
        },
      });

      await tx.employee.update({
        where: {
          id: existingUser.employee!.id,
        },
        data: {
          nama: payload.nama,
          divisi: payload.divisi,
          kategori: payload.kategori,
          deletedAt: null,
        },
      });
    });

    return {
      status: "restored" as const,
      employeeId: existingUser.employee.id,
    };
  }

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      name: payload.nama,
      password,
      role: UserRole.KARYAWAN,
      deletedAt: null,
      employee: {
        create: {
          nama: payload.nama,
          divisi: payload.divisi,
          kategori: payload.kategori,
          deletedAt: null,
        },
      },
    },
    include: {
      employee: true,
    },
  });

  const reloaded = await prisma.user.findUnique({
    where: {
      id: existingUser.id,
    },
    include: {
      employee: true,
    },
  });

  return {
    status: "restored" as const,
    employeeId: reloaded?.employee?.id ?? null,
  };
}

export async function getEmployeeMasterData() {
  await assertAdminSession();

  const [activeEmployees, archivedEmployees] = await Promise.all([
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: {
          deletedAt: null,
          role: UserRole.KARYAWAN,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            deletedAt: true,
          },
        },
      },
      orderBy: [{ divisi: "asc" }, { nama: "asc" }],
    }),
    prisma.employee.findMany({
      where: {
        user: {
          role: UserRole.KARYAWAN,
        },
        OR: [
          {
            deletedAt: {
              not: null,
            },
          },
          {
            user: {
              deletedAt: {
                not: null,
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            deletedAt: true,
          },
        },
      },
      orderBy: [{ deletedAt: "desc" }, { nama: "asc" }],
    }),
  ]);

  return {
    activeEmployees,
    archivedEmployees,
  };
}

export async function getActiveEmployeeById(id: string) {
  await assertAdminSession();

  return prisma.employee.findFirst({
    where: {
      id,
      deletedAt: null,
      user: {
        deletedAt: null,
        role: UserRole.KARYAWAN,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function createEmployeeAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const parsed = employeeCreateSchema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    divisi: formData.get("divisi"),
    kategori: formData.get("kategori"),
  });

  if (!parsed.success) {
    return errorState("Periksa kembali data karyawan.", parsed.error.flatten().fieldErrors);
  }

  try {
    const result = await restoreOrAttachEmployee(parsed.data);

    revalidateEmployeeRoutes(result.employeeId ?? undefined);

    return successState(
      result.status === "created"
        ? "Karyawan berhasil ditambahkan."
        : "Karyawan yang terhapus berhasil dipulihkan.",
    );
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Gagal menyimpan data karyawan.");
  }
}

export async function updateEmployeeAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminSession();

  const parsed = employeeUpdateSchema.safeParse({
    id: formData.get("id"),
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    divisi: formData.get("divisi"),
    kategori: formData.get("kategori"),
  });

  if (!parsed.success) {
    return errorState("Periksa kembali data karyawan.", parsed.error.flatten().fieldErrors);
  }

  const currentEmployee = await prisma.employee.findFirst({
    where: {
      id: parsed.data.id,
      deletedAt: null,
      user: {
        deletedAt: null,
        role: UserRole.KARYAWAN,
      },
    },
    include: {
      user: true,
    },
  });

  if (!currentEmployee) {
    return errorState("Karyawan tidak ditemukan.");
  }

  const emailConflict = await prisma.user.findFirst({
    where: {
      email: parsed.data.email,
      id: {
        not: currentEmployee.userId,
      },
    },
    include: {
      employee: true,
    },
  });

  if (emailConflict) {
    const message =
      emailConflict.role === UserRole.ADMIN
        ? "Email tersebut sudah dipakai akun admin."
        : "Email tersebut sudah digunakan karyawan lain.";

    return errorState(message, {
      email: [message],
    });
  }

  const password = parsed.data.password
    ? await hashPassword(parsed.data.password)
    : currentEmployee.user.password;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: currentEmployee.userId,
      },
      data: {
        name: parsed.data.nama,
        email: parsed.data.email,
        password,
      },
    });

    await tx.employee.update({
      where: {
        id: parsed.data.id,
      },
      data: {
        nama: parsed.data.nama,
        divisi: parsed.data.divisi,
        kategori: parsed.data.kategori,
      },
    });
  });

  revalidateEmployeeRoutes(parsed.data.id);
  return successState("Data karyawan berhasil diperbarui.");
}

export async function archiveEmployeeAction(formData: FormData) {
  await assertAdminSession();

  const employeeId = z.string().uuid().parse(formData.get("id"));

  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    return;
  }

  const deletedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        deletedAt,
      },
    });

    await tx.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        deletedAt,
      },
    });
  });

  revalidateEmployeeRoutes(employeeId);
}

export async function restoreEmployeeAction(formData: FormData) {
  await assertAdminSession();

  const employeeId = z.string().uuid().parse(formData.get("id"));

  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        deletedAt: null,
      },
    });

    await tx.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        deletedAt: null,
        role: UserRole.KARYAWAN,
      },
    });
  });

  revalidateEmployeeRoutes(employeeId);
}

export async function importEmployeesAction(
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

    return employeeImportRowSchema.safeParse({
      nama: toSpreadsheetString(normalizedRow.nama),
      email: toSpreadsheetString(normalizedRow.email),
      password: toSpreadsheetString(normalizedRow.password),
      divisi: toSpreadsheetString(normalizedRow.divisi).toUpperCase(),
      kategori: toSpreadsheetString(normalizedRow.kategori),
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
    .map((result) => result.data);

  let createdCount = 0;
  let updatedCount = 0;
  let restoredCount = 0;

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index]!;
      const existingUser = await tx.user.findUnique({
        where: {
          email: row.email,
        },
        include: {
          employee: true,
        },
      });

      if (!existingUser) {
        const password = await hashPassword(row.password);

        await tx.user.create({
          data: {
            name: row.nama,
            email: row.email,
            password,
            role: UserRole.KARYAWAN,
            employee: {
              create: {
                nama: row.nama,
                divisi: row.divisi,
                kategori: row.kategori,
              },
            },
          },
        });
        createdCount += 1;
        continue;
      }

      if (existingUser.role === UserRole.ADMIN) {
        throw new Error(`Baris ${index + 2}: email tersebut dipakai akun admin.`);
      }

      const password = await hashPassword(row.password);
      const isActiveEmployee = !existingUser.deletedAt && !existingUser.employee?.deletedAt;

      await tx.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          name: row.nama,
          email: row.email,
          password,
          role: UserRole.KARYAWAN,
          deletedAt: null,
        },
      });

      if (existingUser.employee) {
        await tx.employee.update({
          where: {
            id: existingUser.employee.id,
          },
          data: {
            nama: row.nama,
            divisi: row.divisi,
            kategori: row.kategori,
            deletedAt: null,
          },
        });
      } else {
        await tx.employee.create({
          data: {
            userId: existingUser.id,
            nama: row.nama,
            divisi: row.divisi,
            kategori: row.kategori,
          },
        });
      }

      if (isActiveEmployee) {
        updatedCount += 1;
      } else {
        restoredCount += 1;
      }
    }
  }, {
    maxWait: 15000,
    timeout: 60000,
  });

  revalidateEmployeeRoutes();

  return successState(
    `Import karyawan selesai. ${createdCount} dibuat, ${updatedCount} diperbarui, ${restoredCount} dipulihkan.`,
  );
}
