import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseXlsx } from "@/lib/parse-xlsx";
import { eventsToIcs, filterByClasses, parseClassesParam } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const events = await fetchAndParseXlsx();
    const classes = parseClassesParam(request.nextUrl.searchParams.get("classes"));
    const filtered = filterByClasses(events, classes);

    const name =
      classes && classes.length
        ? `EDT SAPHIRE — ${classes.join(", ")}`
        : "EDT SAPHIRE";

    const ics = eventsToIcs(filtered, { calendarName: name });

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Failed to export ICS:", error);
    return NextResponse.json({ error: "Failed to export ICS" }, { status: 500 });
  }
}
