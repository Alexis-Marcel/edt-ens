import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseXlsx } from "@/lib/parse-xlsx";
import { eventsToCsv, filterByClasses, parseClassesParam } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const events = await fetchAndParseXlsx();
    const classes = parseClassesParam(request.nextUrl.searchParams.get("classes"));
    const filtered = filterByClasses(events, classes);
    const csv = eventsToCsv(filtered);

    const suffix = classes && classes.length ? `-${classes.join("-")}` : "";
    const filename = `edt-saphire${suffix}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Failed to export CSV:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
