import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { GlobeBackground } from "@/components/GlobeBackground";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1220] px-4 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
        <GlobeBackground size={720} />
      </div>
      <div className="relative z-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
