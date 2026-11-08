"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import type { Session } from "@/lib/identity";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface UseAuth {
  session: Session;
  /** False until Firebase reports the initial auth state. */
  authReady: boolean;
  /** Email/password sign-in for existing accounts. */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Creates a new account with email/password. */
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

function sessionFromUser(user: User | null): Session {
  if (!user) return { kind: "guest" };
  return {
    kind: "authenticated",
    identifier: user.email ?? user.displayName ?? null,
  };
}

/** Maps Firebase auth error codes to clear, user-facing messages. */
function messageForError(code: string, rawMessage?: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/user-not-found":
      return "No account found with this email. Please create an account first.";
    case "auth/email-already-in-use":
      return "This email already has an account. Please sign in instead.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please enable Email/Password or Google in Firebase Console → Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add it in Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    default:
      // Show the raw Firebase error so the user can report it.
      return rawMessage || `Authentication error: ${code}`;
  }
}

/**
 * Firebase-backed session model. Tracks Guest_State vs Authenticated_State via
 * onAuthStateChanged. Does NOT rely on localStorage for login proof.
 */
export function useAuth(): UseAuth {
  const [session, setSession] = useState<Session>({ kind: "guest" });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.log("[Auth] Subscribing to onAuthStateChanged…");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] onAuthStateChanged:", user ? user.email : "null (guest)");
      if (!user) {
        // Clear stale localStorage profile when Firebase confirms no user.
        if (typeof window !== "undefined") {
          localStorage.removeItem("mediscan_user_profile");
        }
      }
      setSession(sessionFromUser(user));
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      console.log("[Auth] Email sign-in started:", email);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("[Auth] Email sign-in SUCCESS");
        return { ok: true };
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        const message = (err as { message?: string }).message ?? "";
        console.error("[Auth] Email sign-in FAILED:", code, message);
        return { ok: false, error: messageForError(code, message) };
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      console.log("[Auth] Email sign-up started:", email);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("[Auth] Email sign-up SUCCESS");
        return { ok: true };
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        const message = (err as { message?: string }).message ?? "";
        console.error("[Auth] Email sign-up FAILED:", code, message);
        return { ok: false, error: messageForError(code, message) };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    console.log("[Auth] Google sign-in started");
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("[Auth] Google sign-in SUCCESS");
      return { ok: true };
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      const message = (err as { message?: string }).message ?? "";
      console.error("[Auth] Google sign-in FAILED:", code, message);
      return { ok: false, error: messageForError(code, message) };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    console.log("[Auth] Sign-out started");
    await firebaseSignOut(auth);
    // Clear stale localStorage user profile.
    if (typeof window !== "undefined") {
      localStorage.removeItem("mediscan_user_profile");
    }
    console.log("[Auth] Sign-out complete");
  }, []);

  return { session, authReady, signIn, signUp, signInWithGoogle, signOut };
}
