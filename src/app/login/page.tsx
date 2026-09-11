import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { GlobeLazy } from "@/components/GlobeLazy";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] px-4 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <GlobeLazy size={760} />
      </div>
      <div className="relative z-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
