"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bone,
  BookOpen,
  Calculator,
  Droplets,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Pill,
  ScanLine,
  Siren,
  TestTube,
  Workflow,
  X,
} from "lucide-react";
import { storageService, type UserProfile } from "@/lib/storage";
import { DashboardOverview } from "./DashboardOverview";
import { FeatureSkeleton } from "./FeatureSkeleton";
import type { DashboardTab } from "./types";

/**
 * Heavy feature modules are lazy-loaded with next/dynamic so they are NOT in
 * the initial dashboard bundle. They download/parse only when their tab opens.
 * DashboardOverview (the default view) stays eagerly imported so the first
 * paint is instant.
 */
const skeleton = (label: string) => () => <FeatureSkeleton label={label} />;

const MedicineReminders = dynamic(
  () => import("./MedicineReminders").then((m) => m.MedicineReminders),
  { loading: skeleton("Loading medicine reminders…"), ssr: false }
);
const PrescriptionScanner = dynamic(
  () => import("./PrescriptionScanner").then((m) => m.PrescriptionScanner),
  { loading: skeleton("Loading prescription scanner…"), ssr: false }
);
const XRayAnalyzer = dynamic(
  () => import("./XRayAnalyzer").then((m) => m.XRayAnalyzer),
  { loading: skeleton("Loading X-ray analyzer…"), ssr: false }
);
const BMICalculator = dynamic(
  () => import("./BMICalculator").then((m) => m.BMICalculator),
  { loading: skeleton("Loading BMI calculator…"), ssr: false }
);
const WaterIntake = dynamic(() => import("./WaterIntake").then((m) => m.WaterIntake), {
  loading: skeleton("Loading hydration tracker…"),
  ssr: false,
});
const HealthStats = dynamic(() => import("./HealthStats").then((m) => m.HealthStats), {
  loading: skeleton("Loading health statistics…"),
  ssr: false,
});
const ReportsAnalytics = dynamic(
  () => import("./ReportsAnalytics").then((m) => m.ReportsAnalytics),
  { loading: skeleton("Loading reports & analytics…"), ssr: false }
);
const EmergencySOS = dynamic(() => import("./EmergencySOS").then((m) => m.EmergencySOS), {
  loading: skeleton("Loading emergency tools…"),
  ssr: false,
});
const AIChatbot = dynamic(() => import("./AIChatbot").then((m) => m.AIChatbot), {
  loading: skeleton("Loading AI assistant…"),
  ssr: false,
});
const PatientOnboarding = dynamic(
  () => import("./PatientOnboarding").then((m) => m.PatientOnboarding),
  { loading: skeleton("Loading onboarding…"), ssr: false }
);
const LabReportAnalyzer = dynamic(
  () => import("./LabReportAnalyzer").then((m) => m.LabReportAnalyzer),
  { loading: skeleton("Loading lab report analyzer…"), ssr: false }
);
const ReportSummarizer = dynamic(
  () => import("./ReportSummarizer").then((m) => m.ReportSummarizer),
  { loading: skeleton("Loading report summarizer…"), ssr: false }
);
const FollowUpManager = dynamic(
  () => import("./FollowUpManager").then((m) => m.FollowUpManager),
  { loading: skeleton("Loading follow-up manager…"), ssr: false }
);
const SystemArchitecture = dynamic(
  () => import("./SystemArchitecture").then((m) => m.SystemArchitecture),
  { loading: skeleton("Loading system architecture…"), ssr: false }
);
const PatientPriority = dynamic(
  () => import("./PatientPriority").then((m) => m.PatientPriority),
  { loading: skeleton("Loading patient priority…"), ssr: false }
);
const HealthAnalytics = dynamic(
  () => import("./HealthAnalytics").then((m) => m.HealthAnalytics),
  { loading: skeleton("Loading health analytics…"), ssr: false }
);

interface MediTrackDashboardProps {
  /** Email of the authenticated Firebase user. */
  email: string;
  /** Optional display name. */
  name?: string;
  onLogout: () => void;
}

const navItems: { id: DashboardTab; label: string; Icon: typeof Home }[] = [
  { id: "overview", label: "Overview", Icon: Home },
  { id: "medicine", label: "Medicine", Icon: Pill },
  { id: "scanner", label: "Scan Rx", Icon: ScanLine },
  { id: "xray", label: "X-Ray Analyzer", Icon: Bone },
  { id: "bmi", label: "BMI", Icon: Calculator },
  { id: "water", label: "Hydration", Icon: Droplets },
  { id: "stats", label: "Statistics", Icon: BarChart3 },
  { id: "reports", label: "Reports", Icon: BarChart3 },
  { id: "sos", label: "Emergency", Icon: AlertTriangle },
  { id: "chat", label: "AI Assistant", Icon: MessageSquare },
  { id: "lab-report", label: "Lab Reports", Icon: TestTube },
  { id: "summarizer", label: "Summarizer", Icon: BookOpen },
  { id: "follow-up", label: "Follow-Ups", Icon: Bell },
  { id: "priority", label: "Priority Engine", Icon: Siren },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "architecture", label: "Architecture", Icon: Workflow },
];

export function MediTrackDashboard({ email, name, onLogout }: MediTrackDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Read the cached profile from localStorage once (no duplicate reads).
    const p = storageService.getOrCreateUserProfile(email, name);
    setProfile(p);
    setShowOnboarding(!p.onboardingComplete);
  }, [email, name]);

  const completeOnboarding = (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = { ...profile, ...data, onboardingComplete: true };
    storageService.saveUserProfile(updated);
    setProfile(updated);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    if (!profile) return;
    const updated: UserProfile = { ...profile, onboardingComplete: true };
    storageService.saveUserProfile(updated);
    setProfile(updated);
    setShowOnboarding(false);
  };

  if (!profile) {
    // Brief, since localStorage read is synchronous; matches dashboard layout.
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center text-white/60">
        Preparing your health dashboard…
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<FeatureSkeleton label="Loading onboarding…" />}>
        <PatientOnboarding user={profile} onComplete={completeOnboarding} onSkip={skipOnboarding} />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview user={profile} onNavigate={setActiveTab} />;
      case "medicine":
        return <MedicineReminders />;
      case "scanner":
        return <PrescriptionScanner onMedicinesExtracted={() => setActiveTab("medicine")} />;
      case "xray":
        return <XRayAnalyzer />;
      case "bmi":
        return <BMICalculator />;
      case "water":
        return <WaterIntake />;
      case "stats":
        return <HealthStats />;
      case "reports":
        return <ReportsAnalytics />;
      case "sos":
        return <EmergencySOS user={profile} />;
      case "chat":
        return <AIChatbot user={profile} />;
      case "lab-report":
        return <LabReportAnalyzer />;
      case "summarizer":
        return <ReportSummarizer />;
      case "follow-up":
        return <FollowUpManager />;
      case "architecture":
        return <SystemArchitecture />;
      case "priority":
        return <PatientPriority />;
      case "analytics":
        return <HealthAnalytics />;
      default:
        return <DashboardOverview user={profile} onNavigate={setActiveTab} />;
    }
  };

  const activeLabel =
    activeTab === "overview"
      ? `Welcome, ${profile.name}`
      : navItems.find((i) => i.id === activeTab)?.label || activeTab;

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col p-4 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="liquid-glass-strong flex h-full flex-col rounded-[2rem] p-4">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Activity className="h-6 w-6 text-white" strokeWidth={1.5} />
              </span>
              <span className="text-lg font-semibold text-white">MediScan AI</span>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              Main Menu
            </p>
            {navItems.map((item) => (
              <button
                key={`${item.id}-${item.label}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.Icon className="h-5 w-5" strokeWidth={1.5} />
                {item.label}
                {item.id === "sos" && (
                  <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-white/70" />
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-white/10 pt-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <span className="text-sm font-semibold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{profile.name}</p>
                <p className="truncate text-xs text-white/50">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 px-4 py-4 lg:px-6">
          <div className="liquid-glass flex items-center justify-between rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-medium capitalize text-white">{activeLabel}</h1>
                <p className="text-xs text-white/50">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          {/* Suspense wrapper provides a skeleton for whichever lazy tab opens. */}
          <Suspense fallback={<FeatureSkeleton label="Loading…" />}>{renderContent()}</Suspense>
        </motion.div>
      </main>
    </div>
  );
}
