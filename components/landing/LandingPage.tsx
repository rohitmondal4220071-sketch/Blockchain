"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { AuthModal } from "./AuthModal";
import { BottomQuote } from "./BottomQuote";
import { BrandHeader } from "./BrandHeader";
import { HeroContent } from "./HeroContent";
import { HeroPanel } from "./HeroPanel";

export function LandingPage() {
  const router = useRouter();
  const {
    authReady,
    identityLabel,
    isAuthenticated,
    isModalOpen,
    closeModal,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    requestProtectedAction,
  } = useProtectedAction();

  // If Firebase confirms the user is already logged in, redirect to dashboard
  // immediately (handles the case where someone navigates back to / while
  // still authenticated).
  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authReady, isAuthenticated, router]);

  // While Firebase is resolving auth state, show a brief loading indicator
  // instead of rendering stale data.
  if (!authReady) {
    return (
      <main className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          <span className="text-sm">Checking session…</span>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* z-10 UI content */}
      <main className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
        <HeroPanel>
          <BrandHeader
            identityLabel={identityLabel}
            isAuthenticated={isAuthenticated}
            onSignOut={signOut}
            onMenuActivate={() =>
              requestProtectedAction(undefined, document.activeElement as HTMLElement)
            }
          />

          <HeroContent
            onPrimaryAction={(el) => requestProtectedAction(undefined, el)}
            onFeatureAction={(_label, el) =>
              requestProtectedAction(undefined, el)
            }
          />

          <BottomQuote />
        </HeroPanel>
      </main>

      <AuthModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onEmailSubmit={(email, password) => signIn(email, password)}
        onEmailSignUp={(email, password) => signUp(email, password)}
        onGoogleSignIn={signInWithGoogle}
      />
    </>
  );
}
