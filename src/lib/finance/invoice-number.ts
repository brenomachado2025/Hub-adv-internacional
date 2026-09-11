import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function nextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { userId, number: { startsWith: `INV-${year}-` } },
  });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

function isUniqueNumberConflict(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    Array.isArray((err.meta as { target?: unknown })?.target) &&
    ((err.meta as { target: string[] }).target).includes("number")
  );
}

// prisma.invoice.number tem @@unique([userId, number]) - contar registros existentes
// para gerar o próximo sequencial não é atômico, então duas requisições concorrentes
// podem calcular o mesmo número. Em vez de deixar a criação estourar com um erro cru,
// tenta de novo com um número recalculado algumas vezes antes de desistir.
export async function createInvoiceWithNumber<T>(
  userId: string,
  buildData: (number: string) => Prisma.InvoiceCreateArgs["data"],
  include?: Prisma.InvoiceInclude
): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const number = await nextInvoiceNumber(userId);
    try {
      const invoice = await prisma.invoice.create({
        data: buildData(number),
        include,
      });
      return invoice as T;
    } catch (err) {
      if (isUniqueNumberConflict(err) && attempt < maxAttempts) continue;
      throw err;
    }
  }
  throw new Error("Não foi possível gerar um número de fatura único após várias tentativas.");
}
