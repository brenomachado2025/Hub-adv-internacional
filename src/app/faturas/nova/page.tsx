import { Suspense } from "react";
import { NovaFaturaForm } from "./NovaFaturaForm";
import { FinanceAccessGate } from "@/components/FinanceAccessGate";

export default function NovaFaturaPage() {
  return (
    <FinanceAccessGate>
      <Suspense fallback={<p className="text-sm text-neutral-500">Carregando...</p>}>
        <NovaFaturaForm />
      </Suspense>
    </FinanceAccessGate>
  );
}
