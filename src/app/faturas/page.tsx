import { FinanceAccessGate } from "@/components/FinanceAccessGate";
import { FaturasView } from "@/components/finance/FaturasView";

export const dynamic = "force-dynamic";

export default function FaturasPage() {
  return (
    <FinanceAccessGate>
      <FaturasView />
    </FinanceAccessGate>
  );
}
