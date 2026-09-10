import { NextResponse } from "next/server";
import { getSuperadminAccess } from "@/lib/auth/superadmin-session";
import { queryDataJudProcess } from "@/lib/legal/datajud";

export async function POST() {
  const superadmin = await getSuperadminAccess();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const result = await queryDataJudProcess("api_publica_trf1", "00008323520184013202");
    return NextResponse.json({ ok: true, found: result.found });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "erro desconhecido" });
  }
}
