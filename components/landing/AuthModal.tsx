"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Shield, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CONFIG } from "@/lib/config";

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string, password: string) => Promise<AuthResult>;
  onEmailSignUp: (email: string, password: string) => Promise<AuthResult>;
  onGoogleSignIn: () => Promise<AuthResult>;
}

type AuthMode = "signin" | "signup";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Cinematic authentication modal with focus trap, Escape-to-close, initial
 * focus, and focus restoration. Requirements 10.1–10.10, 15.2–15.5.
 */
export function AuthModal({
  isOpen,
  onClose,
  onEmailSubmit,
  onEmailSignUp,
  onGoogleSignIn,
}: AuthModalProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  // Reset transient state whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setMode("signin");
      setError(null);
      setPending(null);
    }
  }, [isOpen]);

  // Move focus to the first interactive element when opened.
  useEffect(() => {
    if (!isOpen) return;
    const node = dialogRef.current;
    if (!node) return;
    const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusable[0]?.focus();
  }, [isOpen]);

  // Escape closes; Tab is trapped within the dialog.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending("email");
    const result =
      mode === "signup"
        ? await onEmailSignUp(email, password)
        : await onEmailSubmit(email, password);
    if (!result.ok) {
      setError(
        result.error ??
          (mode === "signup"
            ? "Unable to create account. Please try again."
            : "Unable to sign in. Please try again.")
      );
      setPending(null);
    }
    // On success the parent closes the modal.
  };

  const toggleMode = () => {
    if (pending) return;
    setError(null);
    setMode((m) => (m === "signin" ? "signup" : "signin"));
  };

  const handleGoogle = async () => {
    if (pending) return;
    setError(null);
    setPending("google");
    const result = await onGoogleSignIn();
    if (!result.ok) {
      setError(result.error ?? "Unable to sign in. Please try again.");
      setPending(null);
    }
  };

  const busy = pending !== null;
  const isSignUp = mode === "signup";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onKeyDown={onKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-subtitle"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="liquid-glass-strong relative z-10 w-full max-w-md rounded-[2rem] p-8"
          >
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Shield className="h-6 w-6 text-white" strokeWidth={1.5} />
              </span>
              <h2
                id="auth-modal-title"
                className="text-2xl font-medium tracking-tight text-white"
              >
                {isSignUp ? CONFIG.modal.signUpTitle : CONFIG.modal.title}
              </h2>
              <p id="auth-modal-subtitle" className="text-sm text-white/60">
                {isSignUp ? CONFIG.modal.signUpSubtitle : CONFIG.modal.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="auth-email" className="text-xs text-white/60">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="auth-password" className="text-xs text-white/60">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  disabled={busy}
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="text-center text-xs text-white/70"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="liquid-glass mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.99] disabled:opacity-60"
              >
                {pending === "email" ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                ) : null}
                {isSignUp ? CONFIG.modal.signUpLabel : CONFIG.modal.signInLabel}
              </button>
            </form>

            {/* Switch between Sign In and Create Account */}
            <p className="mt-4 text-center text-xs text-white/50">
              {isSignUp
                ? CONFIG.modal.switchToSignInPrompt
                : CONFIG.modal.switchToSignUpPrompt}{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={busy}
                className="font-medium text-white underline-offset-4 outline-none transition hover:underline focus-visible:underline disabled:opacity-60"
              >
                {isSignUp
                  ? CONFIG.modal.switchToSignInAction
                  : CONFIG.modal.switchToSignUpAction}
              </button>
            </p>

            {/* OR divider */}
            <div className="my-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-xs text-white/40">OR</span>
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <motion.button
              type="button"
              aria-label={CONFIG.modal.googleLabel}
              onClick={handleGoogle}
              disabled={busy}
              whileHover={reduceMotion || busy ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion || busy ? undefined : { scale: 0.98 }}
              className="liquid-glass flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-white outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60"
            >
              {pending === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <GoogleIcon />
              )}
              {CONFIG.modal.googleLabel}
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Monochrome white Google glyph to respect the grayscale palette. */
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21.6 12.227c0-.682-.061-1.337-.175-1.965H12v3.72h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.23c1.89-1.74 2.984-4.302 2.984-7.283Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.617-2.42l-3.23-2.51c-.895.6-2.04.955-3.387.955-2.605 0-4.81-1.76-5.597-4.123H3.06v2.59A9.996 9.996 0 0 0 12 22Z"
        fill="#fff"
        fillOpacity="0.7"
      />
      <path
        d="M6.403 13.902A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.302.314-1.902V7.508H3.06A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.06 4.492l3.343-2.59Z"
        fill="#fff"
        fillOpacity="0.5"
      />
      <path
        d="M12 5.975c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.06 7.508l3.343 2.59C7.19 7.735 9.395 5.975 12 5.975Z"
        fill="#fff"
        fillOpacity="0.85"
      />
    </svg>
  );
}
