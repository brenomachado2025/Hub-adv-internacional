"use client";

import { useMemo, useState } from "react";
import { TIMEZONE_OPTIONS } from "@/lib/data/timezones";

type GridSlot = {
  utcHour: number;
  perTimezone: { tz: string; localHour: number; localTime: string; localWeekday: number; inBusinessHours: boolean }[];
  inCount: number;
  allInBusinessHours: boolean;
};

type ConflictZone = {
  date: string;
  holidayCountries: { countryCode: string; name: string }[];
  freeCountries: string[];
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "Estados Unidos",
  CA: "Canadá",
  MX: "México",
  BR: "Brasil",
  CO: "Colômbia",
  AR: "Argentina",
  GB: "Reino Unido",
  PT: "Portugal",
  ES: "Espanha",
  FR: "França",
  DE: "Alemanha",
  CH: "Suíça",
  RU: "Rússia",
  ZA: "África do Sul",
  AE: "Emirados Árabes",
  IN: "Índia",
  CN: "China",
  SG: "Singapura",
  JP: "Japão",
  HK: "Hong Kong",
  AU: "Austrália",
};

export default function ReunioesPage() {
  const [selectedTz, setSelectedTz] = useState<string[]>(["America/New_York", "Europe/Lisbon"]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [businessStart, setBusinessStart] = useState(9);
  const [businessEnd, setBusinessEnd] = useState(18);
  const [grid, setGrid] = useState<GridSlot[]>([]);
  const [bestSlots, setBestSlots] = useState<number[]>([]);
  const [fallbackSlots, setFallbackSlots] = useState<number[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear());
  const [conflictZones, setConflictZones] = useState<ConflictZone[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);

  const countryCodes = useMemo(() => {
    const codes = selectedTz
      .map((tz) => TIMEZONE_OPTIONS.find((o) => o.tz === tz)?.countryCode)
      .filter((c): c is string => !!c);
    return Array.from(new Set(codes));
  }, [selectedTz]);

  const toggleTz = (tz: string) => {
    setSelectedTz((prev) => (prev.includes(tz) ? prev.filter((t) => t !== tz) : [...prev, tz]));
  };

  const suggest = async () => {
    setLoadingGrid(true);
    try {
      const res = await fetch("/api/meetings/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timezones: selectedTz, businessStart, businessEnd }),
      });
      const data = await res.json();
      setGrid(data.grid ?? []);
      setBestSlots(data.bestSlots ?? []);
      setFallbackSlots(data.fallbackSlots ?? []);
    } finally {
      setLoadingGrid(false);
    }
  };

  const findConflicts = async () => {
    setLoadingConflicts(true);
    try {
      const res = await fetch("/api/holidays/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCodes, year }),
      });
      const data = await res.json();
      setConflictZones(data.conflictZones ?? []);
    } finally {
      setLoadingConflicts(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assistente de Reunião Multi-Fuso</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Sugestão de horário considerando o expediente comercial de todos os participantes, e detecção de zonas de
          conflito de feriados no calendário.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h3 className="font-semibold text-sm">Participantes (fuso horário)</h3>
        <div className="flex flex-wrap gap-2">
          {TIMEZONE_OPTIONS.map((opt) => (
            <button
              key={opt.tz}
              onClick={() => toggleTz(opt.tz)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                selectedTz.includes(opt.tz)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-neutral-500">Data de referência</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Expediente - início (hora local)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={businessStart}
              onChange={(e) => setBusinessStart(Number(e.target.value))}
              className="block mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm w-24"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Expediente - fim (hora local)</label>
            <input
              type="number"
              min={0}
              max={24}
              value={businessEnd}
              onChange={(e) => setBusinessEnd(Number(e.target.value))}
              className="block mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm w-24"
            />
          </div>
          <button
            onClick={suggest}
            disabled={loadingGrid || selectedTz.length === 0}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loadingGrid ? "Calculando..." : "Sugerir horário"}
          </button>
        </div>

        {grid.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm">
              {bestSlots.length > 0 ? (
                <p className="text-emerald-700 dark:text-emerald-400">
                  Horários com sobreposição total do expediente (hora UTC): {bestSlots.map((h) => `${h}:00`).join(", ")}
                </p>
              ) : (
                <p className="text-amber-700 dark:text-amber-400">
                  Não há sobreposição total de expediente. Melhor cobertura parcial (hora UTC):{" "}
                  {fallbackSlots.map((h) => `${h}:00`).join(", ")}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-left sticky left-0 bg-white dark:bg-neutral-950">Fuso / UTC</th>
                    {grid.map((g) => (
                      <th key={g.utcHour} className="p-1 text-center font-normal">
                        {g.utcHour}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTz.map((tz) => (
                    <tr key={tz}>
                      <td className="p-1 sticky left-0 bg-white dark:bg-neutral-950 whitespace-nowrap">
                        {TIMEZONE_OPTIONS.find((o) => o.tz === tz)?.label ?? tz}
                      </td>
                      {grid.map((g) => {
                        const p = g.perTimezone.find((x) => x.tz === tz);
                        return (
                          <td
                            key={g.utcHour}
                            title={p?.localTime}
                            className={`p-1 text-center w-8 ${
                              p?.inBusinessHours ? "bg-emerald-200 dark:bg-emerald-900" : "bg-neutral-100 dark:bg-neutral-900"
                            }`}
                          >
                            {p?.localTime}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <h3 className="font-semibold text-sm">Zonas de conflito no calendário (feriados)</h3>
        <p className="text-xs text-neutral-500">
          Datas em que há feriado em pelo menos um país dos participantes selecionados, mas não em todos. Cobertura de
          feriados por estado dos EUA é limitada; usamos feriados federais como referência.
        </p>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs text-neutral-500">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="block mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm w-28"
            />
          </div>
          <button
            onClick={findConflicts}
            disabled={loadingConflicts || countryCodes.length === 0}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50 self-end"
          >
            {loadingConflicts ? "Buscando..." : "Buscar zonas de conflito"}
          </button>
        </div>

        {conflictZones.length > 0 && (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {conflictZones.map((z) => (
              <li key={z.date} className="text-sm border-b border-neutral-100 dark:border-neutral-900 pb-2">
                <span className="font-medium">{z.date}</span> — feriado em{" "}
                {z.holidayCountries.map((h) => `${COUNTRY_NAMES[h.countryCode] ?? h.countryCode} (${h.name})`).join(", ")}
                ; expediente normal em {z.freeCountries.map((c) => COUNTRY_NAMES[c] ?? c).join(", ")}
              </li>
            ))}
          </ul>
        )}
        {!loadingConflicts && conflictZones.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma zona de conflito encontrada ainda — clique em buscar.</p>
        )}
      </div>
    </div>
  );
}
