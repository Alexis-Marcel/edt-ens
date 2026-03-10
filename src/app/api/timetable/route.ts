import { NextResponse } from "next/server";
import { fetchAndParseXlsx } from "@/lib/parse-xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await fetchAndParseXlsx();
    return NextResponse.json(events, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Failed to fetch timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable data" },
      { status: 500 }
    );
  }
}
