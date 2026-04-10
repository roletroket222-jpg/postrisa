import * as XLSX from "xlsx";

export function parseWorkbookRows(file: File) {
  const supportedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ]);

  if (!file.size) {
    throw new Error("File Excel kosong.");
  }

  if (file.type && !supportedMimeTypes.has(file.type)) {
    throw new Error("Format file tidak didukung. Gunakan .xlsx atau .xls.");
  }

  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("Workbook tidak memiliki sheet.");
    }

    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error("Sheet pertama tidak dapat dibaca.");
    }

    return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });
  });
}

export function normalizeSpreadsheetRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
      value,
    ]),
  );
}

export function toSpreadsheetString(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}
