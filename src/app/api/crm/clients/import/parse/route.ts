import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const MAX_ROWS = 5000;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let headers: string[] = [];
  let rows: string[][] = [];

  try {
    if (name.endsWith(".csv")) {
      const text = buffer.toString("utf-8");
      const records = parse(text, { skip_empty_lines: true }) as string[][];
      if (records.length === 0) throw new Error("Planilha vazia");
      headers = records[0].map((h) => String(h ?? "").trim());
      rows = records.slice(1).map((r) => r.map((c) => String(c ?? "")));
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(buffer).buffer as ArrayBuffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("Planilha vazia");

      sheet.eachRow((row, rowNumber) => {
        const values = (row.values as unknown[]).slice(1).map((v) => {
          if (v === null || v === undefined) return "";
          if (typeof v === "object" && "text" in (v as Record<string, unknown>)) {
            return String((v as Record<string, unknown>).text ?? "");
          }
          if (typeof v === "object" && "result" in (v as Record<string, unknown>)) {
            return String((v as Record<string, unknown>).result ?? "");
          }
          return String(v);
        });
        if (rowNumber === 1) {
          headers = values.map((h) => h.trim());
        } else {
          rows.push(values);
        }
      });
    } else {
      return NextResponse.json(
        { error: "Formato não suportado. Envie um arquivo .csv, .xlsx ou .xls" },
        { status: 400 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falha ao ler o arquivo: ${message}` }, { status: 400 });
  }

  const truncated = rows.length > MAX_ROWS;
  if (truncated) rows = rows.slice(0, MAX_ROWS);

  return NextResponse.json({ headers, rows, truncated });
}
