// Static configuration and copy for the MediScan AI landing page.

export const CONFIG = {
  videoUrl:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4",
  videoTimeoutMs: 5000,
  fontTimeoutMs: 3000,
  brandName: "MediScan AI",
  featurePills: [
    "AI Diagnosis",
    "Prescription Scanner",
    "Medical Report Analysis",
  ] as const,
  headlineLine1: "Reinventing the future of intelligent healthcare.",
  headlineLine2: "Where AI meets precision diagnosis.",
  supportingText:
    "Analyze prescriptions, decode medical reports, detect health risks, and receive AI-powered insights instantly.",
  ctaLabel: "Get Started",
  quoteLabel: "INTELLIGENT HEALTHCARE",
  quote:
    "We imagined a world where medical intelligence becomes universally accessible.",
  quoteAuthor: "MEDISCAN AI LABS",
  modal: {
    title: "Welcome to MediScan AI",
    subtitle: "Secure access to your intelligent healthcare workspace.",
    signInLabel: "Continue Securely",
    signUpLabel: "Create Account",
    googleLabel: "Continue with Google",
    signUpTitle: "Create your account",
    signUpSubtitle: "Join MediScan AI and unlock intelligent healthcare insights.",
    switchToSignUpPrompt: "New to MediScan AI?",
    switchToSignUpAction: "Create an account",
    switchToSignInPrompt: "Already have an account?",
    switchToSignInAction: "Sign in",
  },
} as const;

// Strict grayscale palette (Requirement 2.1) — all HSL saturation 0%.
export const GRAYSCALE = {
  white: "hsl(0 0% 100%)",
  gray90: "hsl(0 0% 90%)",
  gray70: "hsl(0 0% 70%)",
  gray50: "hsl(0 0% 50%)",
  gray20: "hsl(0 0% 20%)",
  gray10: "hsl(0 0% 10%)",
} as const;

export const TEXT_OPACITY_TIERS = [
  "text-white",
  "text-white/80",
  "text-white/60",
  "text-white/50",
] as const;
