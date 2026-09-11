import { Prisma } from "@prisma/client";
import { onlyDigits } from "@/lib/data/crm";

export type ClientFilterParams = {
  status?: string | null;
  legalArea?: string | null;
  city?: string | null;
  q?: string | null;
};

// Compartilhado entre a listagem do CRM (/api/crm/clients) e o envio de e-mail em
// massa (/api/campaigns) - garante que "quem aparece na lista filtrada" e "quem
// recebe o e-mail" sejam exatamente o mesmo público.
export function buildClientWhere(workspaceUserId: string, params: ClientFilterParams): Prisma.CrmClientWhereInput {
  const { status, legalArea, city, q } = params;
  const query = q?.trim() ?? "";

  return {
    userId: workspaceUserId,
    ...(status ? { status } : {}),
    ...(legalArea ? { legalArea } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { documentNumber: { contains: onlyDigits(query) || query } },
            { companyName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
