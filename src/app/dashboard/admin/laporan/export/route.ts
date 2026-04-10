import { buildAdminReportExcelBuffer } from "@/server/exports/report-excel";
import { requireAdminRequestSession } from "@/server/auth/request";
import { getAdminReportData } from "@/server/reports/performance";

export const runtime = "nodejs";

function getSearchParamsObject(request: Request) {
  const url = new URL(request.url);

  return Object.fromEntries(url.searchParams.entries());
}

function buildExcelFilename(from: string, to: string) {
  return `laporan-kinerja-${from}_${to}.xlsx`;
}

export async function GET(request: Request) {
  const access = await requireAdminRequestSession(request);

  if (access.response) {
    return access.response;
  }

  const data = await getAdminReportData(getSearchParamsObject(request));
  const buffer = buildAdminReportExcelBuffer(data);

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${buildExcelFilename(
        data.filters.from,
        data.filters.to,
      )}"`,
    },
  });
}
