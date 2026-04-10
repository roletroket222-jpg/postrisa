import { Prisma } from "@/generated/prisma/client";
import { AuditAction, PerformanceAuditTable } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/client";

export type PerformanceTransactionClient = typeof prisma;

type AuditEntry = {
  recordId?: string | null;
  targetTable: PerformanceAuditTable;
  targetId: string;
  action: AuditAction;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
};

type PerformanceAuditContext = {
  tx: PerformanceTransactionClient;
  logRecord: (entry: Omit<AuditEntry, "targetTable">) => void;
  logItem: (entry: Omit<AuditEntry, "targetTable">) => void;
};

type WithPerformanceAuditOptions<T> = {
  actorUserId: string;
  execute: (context: PerformanceAuditContext) => Promise<T>;
};

type RecordAuditSource = {
  id: string;
  employeeId: string;
  tanggal: Date | string;
  totalUpah: number;
  deletedAt?: Date | string | null;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  itemCount?: number;
  employee?: {
    nama: string;
    divisi: string;
    kategori?: string | null;
  } | null;
  createdBy?: {
    id?: string | undefined;
    name?: string | null | undefined;
  } | null;
};

type ItemAuditSource = {
  id: string;
  recordId: string;
  productId: string;
  qty: number;
  upah: number;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  product?: {
    namaProduk: string;
    divisi: string;
    upahSatuan?: number | null;
  } | null;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function toDateOnlyString(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toAuditJsonValue(
  value: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value;
}

export function toPerformanceRecordAuditSnapshot(record: RecordAuditSource): Prisma.InputJsonValue {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee?.nama ?? null,
    employeeDivision: record.employee?.divisi ?? null,
    employeeKategori: record.employee?.kategori ?? null,
    tanggal: toDateOnlyString(record.tanggal),
    totalUpah: record.totalUpah,
    itemCount: record.itemCount ?? null,
    createdById: record.createdBy?.id ?? null,
    createdByName: record.createdBy?.name ?? null,
    deletedAt: toIsoString(record.deletedAt),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  } satisfies Prisma.InputJsonObject;
}

export function toPerformanceRecordItemAuditSnapshot(
  item: ItemAuditSource,
): Prisma.InputJsonValue {
  return {
    id: item.id,
    recordId: item.recordId,
    productId: item.productId,
    productName: item.product?.namaProduk ?? null,
    productDivision: item.product?.divisi ?? null,
    productUnitUpah: item.product?.upahSatuan ?? null,
    qty: item.qty,
    upah: item.upah,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  } satisfies Prisma.InputJsonObject;
}

export async function withPerformanceAuditMiddleware<T>({
  actorUserId,
  execute,
}: WithPerformanceAuditOptions<T>) {
  return prisma.$transaction(async (transaction) => {
    const tx = transaction as unknown as PerformanceTransactionClient;
    const queue: AuditEntry[] = [];

    const result = await execute({
      tx,
      logRecord: (entry) => {
        queue.push({
          ...entry,
          targetTable: PerformanceAuditTable.PERFORMANCE_RECORD,
        });
      },
      logItem: (entry) => {
        queue.push({
          ...entry,
          targetTable: PerformanceAuditTable.PERFORMANCE_RECORD_ITEM,
        });
      },
    });

    for (const entry of queue) {
      const data: Prisma.PerformanceAuditLogUncheckedCreateInput = {
        recordId: entry.recordId ?? null,
        targetTable: entry.targetTable,
        targetId: entry.targetId,
        action: entry.action,
        actorUserId,
      };

      if (entry.oldValues !== undefined) {
        data.oldValues = toAuditJsonValue(entry.oldValues);
      }

      if (entry.newValues !== undefined) {
        data.newValues = toAuditJsonValue(entry.newValues);
      }

      await tx.performanceAuditLog.create({
        data,
      });
    }

    return result;
  });
}
