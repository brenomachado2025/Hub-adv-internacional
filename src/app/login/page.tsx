import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { GlobeLazy } from "@/components/GlobeLazy";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] px-4 relative">
      <div className="fixed inset-0 pointer-events-none">
        <GlobeLazy />
      </div>
      <div className="relative z-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
