import { buildSlipPdfBuffer } from "@/server/exports/slip-pdf";
import { requireAdminRequestSession } from "@/server/auth/request";
import { getEmployeeSlipDataForAdmin } from "@/server/reports/performance";

export const runtime = "nodejs";

type AdminSlipRouteProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

function getSearchParamsObject(request: Request) {
  const url = new URL(request.url);

  return Object.fromEntries(url.searchParams.entries());
}

function sanitizeFilenameSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(request: Request, { params }: AdminSlipRouteProps) {
  const access = await requireAdminRequestSession(request);

  if (access.response) {
    return access.response;
  }

  const { employeeId } = await params;
  const data = await getEmployeeSlipDataForAdmin(employeeId, getSearchParamsObject(request));

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
