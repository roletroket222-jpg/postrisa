import * as XLSX from "xlsx";

import { formatDateInput } from "@/lib/format";
import { type getAdminReportData } from "@/server/reports/performance";

type AdminReportData = Awaited<ReturnType<typeof getAdminReportData>>;

function getSnapshotUnitUpah(qty: number, upah: number) {
  if (qty <= 0) {
    return 0;
  }

  return Math.round(upah / qty);
}

export function buildAdminReportExcelBuffer(data: AdminReportData) {
  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    ["FILTER"],
    ["Tanggal Dari", data.filters.from],
    ["Tanggal Sampai", data.filters.to],
    ["Divisi", data.filters.division ?? "SEMUA"],
    ["Karyawan", data.employeeOptions.find((employee) => employee.id === data.filters.employeeId)?.nama ?? "SEMUA"],
    [],
    ["RINGKASAN"],
    ["Total Record", data.summary.totalRecords],
    ["Karyawan Terlibat", data.summary.totalEmployees],
    ["Baris Item", data.summary.totalItems],
    ["Total Qty", data.summary.totalQty],
    ["Total Upah", data.summary.totalUpah],
  ];

  const divisionRows = data.divisionSummary.map((division) => ({
    divisi: division.division,
    jumlah_karyawan: division.employeeCount,
    jumlah_record: division.recordCount,
    total_qty: division.totalQty,
    total_upah: division.totalUpah,
  }));

  const employeeRows = data.employeeSummary.map((employee) => ({
    nama: employee.nama,
    divisi: employee.divisi,
    kategori: employee.kategori,
    status: employee.isArchived ? "ARSIP" : "AKTIF",
    jumlah_record: employee.recordCount,
    total_qty: employee.totalQty,
    total_upah: employee.totalUpah,
    tanggal_terakhir: formatDateInput(employee.lastTanggal),
  }));

  const detailRows = data.records.flatMap((record) =>
    record.items.map((item) => ({
      tanggal: formatDateInput(record.tanggal),
      employee_nama: record.employee.nama,
      divisi: record.employee.divisi,
      kategori: record.employee.kategori,
      produk: item.product.namaProduk,
      qty: item.qty,
      upah_satuan_snapshot: getSnapshotUnitUpah(item.qty, item.upah),
      subtotal_item: item.upah,
      total_record: record.totalUpah,
    })),
  );

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Ringkasan");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(divisionRows),
    "Rekap Divisi",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(employeeRows),
    "Rekap Karyawan",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detailRows),
    "Detail Record",
  );

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
}
