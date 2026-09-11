import { FinanceAccessGate } from "@/components/FinanceAccessGate";
import { HonorariosView } from "@/components/finance/HonorariosView";

export const dynamic = "force-dynamic";

export default function HonorariosPage() {
  return (
    <FinanceAccessGate>
      <HonorariosView />
    </FinanceAccessGate>
  );
}
