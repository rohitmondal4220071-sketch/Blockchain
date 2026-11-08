"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { decideProtectedAction } from "@/lib/gating";
import { resolveUserIdentity, type Session } from "@/lib/identity";
import { useAuth, type AuthResult } from "./useAuth";
import { useAuthModal } from "./useAuthModal";

interface AuthContextValue {
  session: Session;
  authReady: boolean;
  identityLabel: string;
  isAuthenticated: boolean;
  isModalOpen: boolean;
  closeModal: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Runs `action` when authenticated, otherwise opens the auth modal. */
  requestProtectedAction: (
    action?: () => void,
    trigger?: HTMLElement | null
  ) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, authReady, signIn, signUp, signInWithGoogle, signOut } =
    useAuth();
  const { isOpen, openModal, closeModal } = useAuthModal();

  // Prefetch the dashboard route/chunks up front so navigation after login is
  // near-instant (the dashboard JS is already warm).
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const requestProtectedAction = useCallback(
    (action?: () => void, trigger?: HTMLElement | null) => {
      // While Firebase hasn't reported auth state yet, don't act on stale data.
      if (!authReady) return;
      const decision = decideProtectedAction(session);
      if (decision.type === "proceed") {
        action?.();
      } else {
        openModal(trigger);
      }
    },
    [session, authReady, openModal]
  );

  // After a successful authentication, close the modal and route to /dashboard.
  const onAuthSuccess = useCallback(() => {
    closeModal();
    router.push("/dashboard");
  }, [closeModal, router]);

  const handleSignIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await signIn(email, password);
      if (result.ok) onAuthSuccess();
      return result;
    },
    [signIn, onAuthSuccess]
  );

  const handleSignUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await signUp(email, password);
      if (result.ok) onAuthSuccess();
      return result;
    },
    [signUp, onAuthSuccess]
  );

  const handleGoogle = useCallback(async (): Promise<AuthResult> => {
    const result = await signInWithGoogle();
    if (result.ok) onAuthSuccess();
    return result;
  }, [signInWithGoogle, onAuthSuccess]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut();
    // Clear stale local state so the landing page shows Guest User cleanly.
    if (typeof window !== "undefined") {
      localStorage.removeItem("mediscan_user_profile");
    }
    router.push("/");
  }, [signOut, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authReady,
      // Until Firebase confirms auth state, always show "Guest User" to avoid
      // flashing a stale user ID from a previous session.
      identityLabel: authReady ? resolveUserIdentity(session) : "Guest User",
      isAuthenticated: authReady && session.kind === "authenticated",
      isModalOpen: isOpen,
      closeModal,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signInWithGoogle: handleGoogle,
      signOut: handleSignOut,
      requestProtectedAction,
    }),
    [
      session,
      authReady,
      isOpen,
      closeModal,
      handleSignIn,
      handleSignUp,
      handleGoogle,
      handleSignOut,
      requestProtectedAction,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useProtectedAction(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useProtectedAction must be used within an AuthProvider");
  }
  return ctx;
}
