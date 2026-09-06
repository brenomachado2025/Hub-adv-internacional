import { Suspense } from "react";
import { NovaFaturaForm } from "./NovaFaturaForm";

export default function NovaFaturaPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Carregando...</p>}>
      <NovaFaturaForm />
    </Suspense>
  );
}
