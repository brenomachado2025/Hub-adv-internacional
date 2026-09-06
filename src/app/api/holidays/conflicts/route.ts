import { NextRequest, NextResponse } from "next/server";
import { getPublicHolidays, findConflictZones } from "@/lib/holidays";

type ConflictRequest = {
  countryCodes: string[];
  year: number;
};

export async function POST(req: NextRequest) {
  const { countryCodes, year } = (await req.json()) as ConflictRequest;

  if (!countryCodes?.length || !year) {
    return NextResponse.json({ error: "countryCodes e year são obrigatórios" }, { status: 400 });
  }

  const uniqueCodes = Array.from(new Set(countryCodes));
  const holidaysByCountry: Record<string, Awaited<ReturnType<typeof getPublicHolidays>>> = {};

  await Promise.all(
    uniqueCodes.map(async (cc) => {
      try {
        holidaysByCountry[cc] = await getPublicHolidays(year, cc);
      } catch {
        holidaysByCountry[cc] = [];
      }
    })
  );

  const conflictZones = findConflictZones(holidaysByCountry, uniqueCodes);

  return NextResponse.json({ holidaysByCountry, conflictZones });
}
