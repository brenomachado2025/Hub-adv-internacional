import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { getActorLabel } from "@/lib/auth/current-user";

type SuggestRequest = {
  date: string; // YYYY-MM-DD, referência (fuso de quem está agendando é irrelevante; usamos UTC como grade)
  timezones: string[];
  businessStart?: number; // hora local, default 9
  businessEnd?: number; // hora local, default 18
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SuggestRequest;
  const { date, timezones, businessStart = 9, businessEnd = 18 } = body;

  if (!date || !timezones?.length) {
    return NextResponse.json({ error: "date e timezones são obrigatórios" }, { status: 400 });
  }

  const hours = Array.from({ length: 24 }, (_, h) => h);

  const grid = hours.map((utcHour) => {
    const utcMoment = DateTime.fromISO(`${date}T00:00:00Z`, { zone: "utc" }).plus({ hours: utcHour });

    const perTimezone = timezones.map((tz) => {
      const local = utcMoment.setZone(tz);
      const inBusinessHours = local.hour >= businessStart && local.hour < businessEnd && local.weekday <= 5;
      return {
        tz,
        localHour: local.hour,
        localTime: local.toFormat("HH:mm"),
        localWeekday: local.weekday,
        inBusinessHours,
      };
    });

    const inCount = perTimezone.filter((p) => p.inBusinessHours).length;

    return {
      utcHour,
      perTimezone,
      inCount,
      allInBusinessHours: inCount === timezones.length,
    };
  });

  const bestSlots = grid
    .filter((g) => g.allInBusinessHours)
    .map((g) => g.utcHour);

  const fallbackSlots =
    bestSlots.length > 0
      ? []
      : (() => {
          const maxIn = Math.max(...grid.map((g) => g.inCount));
          return grid.filter((g) => g.inCount === maxIn).map((g) => g.utcHour);
        })();

  await prisma.auditLog.create({
    data: {
      actor: await getActorLabel(),
      action: "VIEW",
      module: "reunioes",
      query: `${timezones.join(", ")} em ${date}`,
      resultSummary:
        bestSlots.length > 0
          ? `${bestSlots.length} horário(s) com sobreposição total encontrados`
          : `Sem sobreposição total; melhor cobertura: ${fallbackSlots.length} horário(s) parcial(is)`,
    },
  });

  return NextResponse.json({ grid, bestSlots, fallbackSlots, businessStart, businessEnd });
}
