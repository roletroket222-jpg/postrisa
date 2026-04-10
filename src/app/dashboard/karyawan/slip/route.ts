import { buildSlipPdfBuffer } from "@/server/exports/slip-pdf";
import { requireEmployeeRequestSession } from "@/server/auth/request";
import { getEmployeeSlipDataForCurrentEmployee } from "@/server/reports/performance";

export const runtime = "nodejs";

function getSearchParamsObject(request: Request) {
  const url = new URL(request.url);

  return Object.fromEntries(url.searchParams.entries());
}

function sanitizeFilenameSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const access = await requireEmployeeRequestSession(request);

  if (access.response) {
    return access.response;
  }

  const data = await getEmployeeSlipDataForCurrentEmployee(getSearchParamsObject(request));

  if (!data) {
    return new Response("Slip tidak ditemukan.", {
      status: 404,
    });
  }

  const buffer = await buildSlipPdfBuffer(data);
  const fileName = `slip-gaji-${sanitizeFilenameSegment(data.employee.nama)}-${data.filters.from}_${data.filters.to}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
