"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { MediTrackDashboard } from "@/components/meditrack/MediTrackDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { session, authReady, isAuthenticated, signOut } = useProtectedAction();

  // Guard: once Firebase has reported state, bounce guests back to the landing page.
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  // While auth is resolving, or while redirecting a guest, show a quiet loader.
  // (Earth/space background is rendered globally in app/layout.tsx.)
  if (!authReady || !isAuthenticated) {
    return (
      <main className="relative z-10 flex min-h-screen w-full items-center justify-center p-6">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </main>
    );
  }

  const email =
    session.kind === "authenticated" && session.identifier ? session.identifier : "";

  return <MediTrackDashboard email={email} onLogout={signOut} />;
}
