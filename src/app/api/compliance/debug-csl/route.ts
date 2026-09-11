import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

// Rota temporária de diagnóstico - remover depois de confirmar a integração do CSL.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const apiKey = process.env.TRADE_GOV_API_KEY ?? "";
  const url = `https://api.trade.gov/consolidated_screening_list/search?api_key=${apiKey}&q=Ali&size=5`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      keyLength: apiKey.length,
      bodyPreview: text.slice(0, 1500),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), keyLength: apiKey.length });
  }
}
