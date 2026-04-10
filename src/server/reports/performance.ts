import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { type AppDivision } from "@/auth/access-control";
import { DIVISIONS } from "@/lib/constants";
import { formatDateInput } from "@/lib/format";
import {
  requireAdminPageSession,
  requireEmployeePageSession,
} from "@/server/auth/session";
import { prisma } from "@/server/db/client";

import { z } from "zod";

type SearchParamsValue = string | string[] | undefined;

export type ReportSearchParams = Record<string, SearchParamsValue>;

type DateRangeFilters = {
  from: string;
  to: string;
  fromDate: Date;
  toDate: Date;
};

export type AdminReportFilters = DateRangeFilters & {
  division: AppDivision | null;
  employeeId: string | null;
};

type EmployeeDashboardFilters = DateRangeFilters;

type RecordWithRelations = Prisma.PerformanceRecordGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        nama: true;
        divisi: true;
        kategori: true;
        deletedAt: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        name: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            namaProduk: true;
            divisi: true;
            upahSatuan: true;
          };
        };
      };
      orderBy: {
        createdAt: "asc";
      };
    };
  };
}>;

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuidParamSchema = z.string().uuid();
const divisionParamSchema = z.enum(DIVISIONS);

function getSearchParamValue(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
  };
}

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseDateRangeFilters(searchParams: ReportSearchParams): DateRangeFilters {
  const defaults = getCurrentMonthRange();
  const rawFrom = getSearchParamValue(searchParams.from);
  const rawTo = getSearchParamValue(searchParams.to);
  let from = dateParamSchema.safeParse(rawFrom).success ? rawFrom! : defaults.from;
  let to = dateParamSchema.safeParse(rawTo).success ? rawTo! : defaults.to;

  if (from > to) {
    [from, to] = [to, from];
  }

  return {
    from,
    to,
    fromDate: toUtcDate(from),
    toDate: toUtcDate(to),
  };
}

function parseAdminReportFilters(searchParams: ReportSearchParams): AdminReportFilters {
  const dateRange = parseDateRangeFilters(searchParams);
  const rawDivision = getSearchParamValue(searchParams.division);
  const rawEmployeeId = getSearchParamValue(searchParams.employeeId);

  const division = divisionParamSchema.safeParse(rawDivision).success
    ? (rawDivision as AppDivision)
    : null;
  const employeeId = uuidParamSchema.safeParse(rawEmployeeId).success ? rawEmployeeId! : null;

  return {
    ...dateRange,
    division,
    employeeId,
  };
}

function buildAdminRecordWhere(filters: AdminReportFilters): Prisma.PerformanceRecordWhereInput {
  const employeeWhere: Prisma.EmployeeWhereInput = {
    user: {
      role: UserRole.KARYAWAN,
    },
  };

  if (filters.division) {
    employeeWhere.divisi = filters.division;
  }

  const where: Prisma.PerformanceRecordWhereInput = {
    deletedAt: null,
    tanggal: {
      gte: filters.fromDate,
      lte: filters.toDate,
    },
    employee: employeeWhere,
  };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  return where;
}

function buildEmployeeRecordWhere(
  employeeId: string,
  filters: EmployeeDashboardFilters,
): Prisma.PerformanceRecordWhereInput {
  return {
    deletedAt: null,
    employeeId,
    tanggal: {
      gte: filters.fromDate,
      lte: filters.toDate,
    },
  };
}

const performanceRecordInclude = {
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
} satisfies Prisma.PerformanceRecordInclude;

function summarizeRecords(records: RecordWithRelations[]) {
  const uniqueEmployees = new Set<string>();
  let totalQty = 0;
  let totalItems = 0;
  let totalUpah = 0;

  for (const record of records) {
    uniqueEmployees.add(record.employeeId);
    totalUpah += record.totalUpah;
    totalItems += record.items.length;

    for (const item of record.items) {
      totalQty += item.qty;
    }
  }

  return {
    totalRecords: records.length,
    totalEmployees: uniqueEmployees.size,
    totalItems,
    totalQty,
    totalUpah,
  };
}

function buildAdminKasbonWhere(filters: AdminReportFilters): Prisma.KasbonRecordWhereInput {
  const employeeWhere: Prisma.EmployeeWhereInput = {
    user: { role: UserRole.KARYAWAN },
  };

  if (filters.division) {
    employeeWhere.divisi = filters.division;
  }

  const where: Prisma.KasbonRecordWhereInput = {
    deletedAt: null,
    tanggal: {
      gte: filters.fromDate,
      lte: filters.toDate,
    },
    employee: employeeWhere,
  };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  return where;
}

function buildEmployeeKasbonWhere(
  employeeId: string,
  filters: EmployeeDashboardFilters,
): Prisma.KasbonRecordWhereInput {
  return {
    deletedAt: null,
    employeeId,
    tanggal: {
      gte: filters.fromDate,
      lte: filters.toDate,
    },
  };
}

function summarizeKasbons(kasbons: { employeeId: string; nominal: number }[]) {
  const uniqueEmployees = new Set<string>();
  let totalKasbon = 0;

  for (const k of kasbons) {
    uniqueEmployees.add(k.employeeId);
    totalKasbon += k.nominal;
  }

  return {
    totalKasbonRecords: kasbons.length,
    totalKasbonEmployees: uniqueEmployees.size,
    totalKasbon,
  };
}

function buildDivisionSummary(records: RecordWithRelations[]) {
  const map = new Map<
    AppDivision,
    {
      division: AppDivision;
      recordCount: number;
      employeeCount: number;
      totalQty: number;
      totalUpah: number;
      employeeIds: Set<string>;
    }
  >();

  for (const record of records) {
    const division = record.employee.divisi as AppDivision;
    const current =
      map.get(division) ??
      {
        division,
        recordCount: 0,
        employeeCount: 0,
        totalQty: 0,
        totalUpah: 0,
        employeeIds: new Set<string>(),
      };

    current.recordCount += 1;
    current.totalUpah += record.totalUpah;
    current.employeeIds.add(record.employeeId);

    for (const item of record.items) {
      current.totalQty += item.qty;
    }

    map.set(division, current);
  }

  return DIVISIONS.map((division) => {
    const current = map.get(division);

    return {
      division,
      recordCount: current?.recordCount ?? 0,
      employeeCount: current?.employeeIds.size ?? 0,
      totalQty: current?.totalQty ?? 0,
      totalUpah: current?.totalUpah ?? 0,
    };
  });
}

function buildEmployeeSummary(records: RecordWithRelations[], kasbons: { employeeId: string; nominal: number }[]) {
  const map = new Map<
    string,
    {
      employeeId: string;
      nama: string;
      divisi: AppDivision;
      kategori: string;
      isArchived: boolean;
      recordCount: number;
      totalQty: number;
      totalUpah: number;
      totalKasbon: number;
      upahBersih: number;
      lastTanggal: Date;
    }
  >();

  for (const record of records) {
    const current =
      map.get(record.employeeId) ??
      {
        employeeId: record.employeeId,
        nama: record.employee.nama,
        divisi: record.employee.divisi as AppDivision,
        kategori: record.employee.kategori,
        isArchived: Boolean(record.employee.deletedAt),
        recordCount: 0,
        totalQty: 0,
        totalUpah: 0,
        totalKasbon: 0,
        upahBersih: 0,
        lastTanggal: record.tanggal,
      };

    current.recordCount += 1;
    current.totalUpah += record.totalUpah;

    if (record.tanggal > current.lastTanggal) {
      current.lastTanggal = record.tanggal;
    }

    for (const item of record.items) {
      current.totalQty += item.qty;
    }

    map.set(record.employeeId, current);
  }

  for (const k of kasbons) {
    if (map.has(k.employeeId)) {
      const current = map.get(k.employeeId)!;
      current.totalKasbon += k.nominal;
      map.set(k.employeeId, current);
    }
  }

  return [...map.values()].map((row) => ({
    ...row,
    upahBersih: row.totalUpah - row.totalKasbon,
  })).sort((left, right) => {
    if (right.upahBersih !== left.upahBersih) {
      return right.upahBersih - left.upahBersih;
    }

    return left.nama.localeCompare(right.nama);
  });
}

function buildProductSummary(records: RecordWithRelations[]) {
  const map = new Map<
    string,
    {
      productId: string;
      namaProduk: string;
      divisi: AppDivision;
      totalQty: number;
      totalUpah: number;
    }
  >();

  for (const record of records) {
    for (const item of record.items) {
      const current =
        map.get(item.productId) ??
        {
          productId: item.productId,
          namaProduk: item.product.namaProduk,
          divisi: item.product.divisi as AppDivision,
          totalQty: 0,
          totalUpah: 0,
        };

      current.totalQty += item.qty;
      current.totalUpah += item.upah;
      map.set(item.productId, current);
    }
  }

  return [...map.values()].sort((left, right) => {
    if (right.totalUpah !== left.totalUpah) {
      return right.totalUpah - left.totalUpah;
    }

    return left.namaProduk.localeCompare(right.namaProduk);
  });
}

async function fetchFilteredAdminRecords(filters: AdminReportFilters) {
  return prisma.performanceRecord.findMany({
    where: buildAdminRecordWhere(filters),
    include: performanceRecordInclude,
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAdminDashboardData() {
  await requireAdminPageSession();

  const currentMonthFilters = parseDateRangeFilters({});
  const today = formatDateInput(new Date());
  const todayDate = toUtcDate(today);

  const [activeEmployeeCount, activeProductCount, currentMonthRecords, currentMonthKasbons, todayRecords, recentRecords] =
    await Promise.all([
      prisma.employee.count({
        where: {
          deletedAt: null,
          user: { deletedAt: null, role: UserRole.KARYAWAN },
        },
      }),
      prisma.product.count({
        where: { deletedAt: null },
      }),
      prisma.performanceRecord.findMany({
        where: {
          deletedAt: null,
          tanggal: { gte: currentMonthFilters.fromDate, lte: currentMonthFilters.toDate },
        },
        include: performanceRecordInclude,
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      }),
      prisma.kasbonRecord.findMany({
        where: buildAdminKasbonWhere({ ...currentMonthFilters, division: null, employeeId: null }),
        select: { employeeId: true, nominal: true },
      }),
      prisma.performanceRecord.findMany({
        where: { deletedAt: null, tanggal: todayDate },
        include: performanceRecordInclude,
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.performanceRecord.findMany({
        where: { deletedAt: null },
        include: performanceRecordInclude,
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

  const monthSummary = summarizeRecords(currentMonthRecords);
  const todaySummary = summarizeRecords(todayRecords);
  const monthKasbonSummary = summarizeKasbons(currentMonthKasbons);

  return {
    activeEmployeeCount,
    activeProductCount,
    currentMonthFilters,
    currentMonthSummary: monthSummary,
    currentMonthKasbonSummary: monthKasbonSummary,
    todaySummary,
    divisionSummary: buildDivisionSummary(currentMonthRecords),
    topEmployees: buildEmployeeSummary(currentMonthRecords, currentMonthKasbons).slice(0, 5),
    recentRecords,
  };
}

export async function getAdminReportData(searchParams: ReportSearchParams) {
  await requireAdminPageSession();

  const filters = parseAdminReportFilters(searchParams);
  const [records, kasbons, employeeOptions] = await Promise.all([
    fetchFilteredAdminRecords(filters),
    prisma.kasbonRecord.findMany({
      where: buildAdminKasbonWhere(filters),
      select: { employeeId: true, nominal: true },
    }),
    prisma.employee.findMany({
      where: {
        user: {
          role: UserRole.KARYAWAN,
        },
      },
      select: {
        id: true,
        nama: true,
        divisi: true,
        kategori: true,
        deletedAt: true,
        user: { select: { deletedAt: true } },
      },
      orderBy: [{ divisi: "asc" }, { nama: "asc" }],
    }),
  ]);

  return {
    filters,
    employeeOptions: employeeOptions.map((employee) => ({
      id: employee.id,
      nama: employee.nama,
      divisi: employee.divisi as AppDivision,
      kategori: employee.kategori,
      isArchived: Boolean(employee.deletedAt || employee.user.deletedAt),
    })),
    summary: summarizeRecords(records),
    kasbonSummary: summarizeKasbons(kasbons),
    divisionSummary: buildDivisionSummary(records),
    employeeSummary: buildEmployeeSummary(records, kasbons),
    productSummary: buildProductSummary(records).slice(0, 10),
    records,
  };
}

export async function getEmployeeDashboardData(searchParams: ReportSearchParams) {
  const session = await requireEmployeePageSession();
  const filters = parseDateRangeFilters(searchParams);

  if (!session.user.employeeId) {
    return {
      session,
      employee: null,
      filters,
      summary: {
        totalRecords: 0,
        totalEmployees: 0,
        totalItems: 0,
        totalQty: 0,
        totalUpah: 0,
      },
      monthSummary: {
        totalRecords: 0,
        totalEmployees: 0,
        totalItems: 0,
        totalQty: 0,
        totalUpah: 0,
      },
      allTimeSummary: {
        totalRecords: 0,
        totalEmployees: 0,
        totalItems: 0,
        totalQty: 0,
        totalUpah: 0,
      },
      records: [] as RecordWithRelations[],
      productSummary: [] as ReturnType<typeof buildProductSummary>,
    };
  }

  const currentMonthRange = getCurrentMonthRange();
  const [employee, records, kasbons, monthRecords, monthKasbons, allTimeRecords, allTimeKasbons] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: { id: true, nama: true, divisi: true, kategori: true, deletedAt: true },
    }),
    prisma.performanceRecord.findMany({
      where: buildEmployeeRecordWhere(session.user.employeeId, filters),
      include: performanceRecordInclude,
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.kasbonRecord.findMany({
      where: buildEmployeeKasbonWhere(session.user.employeeId, filters),
      select: { employeeId: true, nominal: true },
    }),
    prisma.performanceRecord.findMany({
      where: buildEmployeeRecordWhere(session.user.employeeId, {
        from: currentMonthRange.from,
        to: currentMonthRange.to,
        fromDate: toUtcDate(currentMonthRange.from),
        toDate: toUtcDate(currentMonthRange.to),
      }),
      include: performanceRecordInclude,
      orderBy: [{ tanggal: "desc" }],
    }),
    prisma.kasbonRecord.findMany({
      where: buildEmployeeKasbonWhere(session.user.employeeId, {
        from: currentMonthRange.from,
        to: currentMonthRange.to,
        fromDate: toUtcDate(currentMonthRange.from),
        toDate: toUtcDate(currentMonthRange.to),
      }),
      select: { employeeId: true, nominal: true },
    }),
    prisma.performanceRecord.findMany({
      where: { deletedAt: null, employeeId: session.user.employeeId },
      include: performanceRecordInclude,
      orderBy: [{ tanggal: "desc" }],
    }),
    prisma.kasbonRecord.findMany({
      where: { deletedAt: null, employeeId: session.user.employeeId },
      select: { employeeId: true, nominal: true },
    }),
  ]);

  return {
    session,
    employee,
    filters,
    summary: summarizeRecords(records),
    kasbonSummary: summarizeKasbons(kasbons),
    monthSummary: summarizeRecords(monthRecords),
    monthKasbonSummary: summarizeKasbons(monthKasbons),
    allTimeSummary: summarizeRecords(allTimeRecords),
    allTimeKasbonSummary: summarizeKasbons(allTimeKasbons),
    records,
    productSummary: buildProductSummary(records).slice(0, 8),
  };
}

async function getEmployeeSlipDataByEmployeeId(
  employeeId: string,
  filters: DateRangeFilters,
) {
  const [employee, records, kasbons] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, nama: true, divisi: true, kategori: true, deletedAt: true },
    }),
    prisma.performanceRecord.findMany({
      where: buildEmployeeRecordWhere(employeeId, filters),
      include: performanceRecordInclude,
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
    prisma.kasbonRecord.findMany({
      where: buildEmployeeKasbonWhere(employeeId, filters),
      select: { employeeId: true, nominal: true, tanggal: true, keterangan: true },
      orderBy: [{ tanggal: "asc" }],
    }),
  ]);

  if (!employee) {
    return null;
  }

  const summary = summarizeRecords(records);
  let totalKasbon = 0;
  for (const k of kasbons) {
    totalKasbon += k.nominal;
  }

  return {
    filters,
    employee,
    records,
    kasbons,
    summary,
    totalKasbon,
    upahBersih: summary.totalUpah - totalKasbon,
  };
}

export async function getEmployeeSlipDataForAdmin(
  employeeId: string,
  searchParams: ReportSearchParams,
) {
  await requireAdminPageSession();

  const parsedEmployeeId = uuidParamSchema.safeParse(employeeId);

  if (!parsedEmployeeId.success) {
    return null;
  }

  return getEmployeeSlipDataByEmployeeId(parsedEmployeeId.data, parseDateRangeFilters(searchParams));
}

export async function getEmployeeSlipDataForCurrentEmployee(
  searchParams: ReportSearchParams,
) {
  const session = await requireEmployeePageSession();

  if (!session.user.employeeId) {
    return null;
  }

  return getEmployeeSlipDataByEmployeeId(session.user.employeeId, parseDateRangeFilters(searchParams));
}
